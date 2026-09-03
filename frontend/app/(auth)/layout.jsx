export default function AuthLayout({ children }) {
  return (
    <div data-id="auth-layout" className="min-h-screen flex items-center justify-center bg-[#101010]">
      {children}
    </div>
  );
}
