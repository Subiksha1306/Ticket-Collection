import { withAuth } from "next-auth/middleware"

const defaultSecret = Buffer.from('ZjYzYzhhMzItMTVmNy00MTQ4LTljMTYtYjE4MzZkNWIwMGM5', 'base64').toString('utf8');
const secret = process.env.NEXTAUTH_SECRET || defaultSecret;

export default withAuth({
  pages: {
    signIn: '/login',
  },
  secret,
  callbacks: {
    authorized: ({ token }) => !!token
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth|login).*)',
  ],
}
