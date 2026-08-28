import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ROUTE_PERMISSION_MAP = [
  { prefix: "/pdv", permission: "pdv" },
  { prefix: "/orders", permission: "orders" },
  { prefix: "/estoque", permission: "estoque" },
  { prefix: "/price-table", permission: "price-table" },
  { prefix: "/configuracoes", permission: "configuracoes" },
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (token?.role === "admin") return NextResponse.next();

    const entry = ROUTE_PERMISSION_MAP.find(({ prefix }) => pathname.startsWith(prefix));
    if (entry && !token?.permissoes?.includes(entry.permission)) {
      return NextResponse.redirect(new URL("/home", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/home/:path*",
    "/orders/:path*",
    "/price-table/:path*",
    "/estoque/:path*",
    "/pdv/:path*",
    "/configuracoes/:path*",
  ],
};
