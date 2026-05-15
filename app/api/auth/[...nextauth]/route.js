import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";

export const TODAS_PERMISSOES = ["pdv", "orders", "estoque", "price-table", "configuracoes"];

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
