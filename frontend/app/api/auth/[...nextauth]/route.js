import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";

// Rate limiter in-memory: 5 tentativas por 15 minutos por email
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(email) {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = loginAttempts.get(key);

  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_ATTEMPTS) return false;
    loginAttempts.set(key, { count: entry.count + 1, resetAt: entry.resetAt });
  } else {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }
  return true;
}

function clearRateLimit(email) {
  loginAttempts.delete(email.toLowerCase());
}

// Validação de variáveis de ambiente obrigatórias
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET não está definido nas variáveis de ambiente");
}
if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI não está definido nas variáveis de ambiente");
}

export const TODAS_PERMISSOES = [
  "pdv", "orders", "estoque", "price-table", "configuracoes",
  "delivery", "clientes", "salao", "financeiro", "whatsapp",
];

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        if (!checkRateLimit(credentials.email)) {
          throw new Error("Muitas tentativas. Tente novamente em 15 minutos.");
        }

        await connectDB();
        const user = await User.findOne({ email: credentials.email })
          .select("+password")
          .populate("permissionGroup");

        if (!user) {
          throw new Error("Credenciais inválidas");
        }

        if (!user.ativo) {
          throw new Error("Usuário inativo. Contate o administrador.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Credenciais inválidas");
        }

        clearRateLimit(credentials.email);

        const permissoes =
          user.role === "admin"
            ? TODAS_PERMISSOES
            : (user.permissionGroup?.permissoes ?? []);

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          foto: user.foto ?? null,
          permissoes,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.foto = user.foto;
        token.permissoes = user.permissoes;
        token.permissoesExp = Date.now() + 5 * 60 * 1000;
      }

      // Re-fetch de permissões a cada 5 minutos para invalidar alterações de grupo
      if (Date.now() > (token.permissoesExp ?? 0)) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id)
            .select("permissionGroup role ativo foto")
            .populate("permissionGroup", "permissoes");

          if (dbUser && dbUser.ativo) {
            token.role = dbUser.role;
            token.foto = dbUser.foto ?? null;
            token.permissoes =
              dbUser.role === "admin"
                ? TODAS_PERMISSOES
                : (dbUser.permissionGroup?.permissoes ?? []);
          }
        } catch {
          // Mantém permissões anteriores se DB falhar
        }
        token.permissoesExp = Date.now() + 5 * 60 * 1000;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.foto = token.foto;
        session.user.permissoes = token.permissoes;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { authOptions };
