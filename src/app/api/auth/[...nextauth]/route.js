import axios from "axios";
import NextAuth from "next-auth";
import FortyTwo from "next-auth/providers/42-school";

const handler = NextAuth({
  providers: [
    FortyTwo({
      clientId: process.env.NEXT_PUBLIC_42_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_42_SECRET_ID,
    }),
  ],
  callbacks: {
    async signIn(user, account, profile) {
      account = user.account;
      profile = user.profile;
      if (account.provider === "42-school") {
        // account.username = profile.login;
        // account.email = profile.email;
        account = { login: profile.login, email: profile.email, ...account };
        console.log(account);
        // try {
        //   await axios
        //     .post(
        //       "http://10.30.164.21:8000/pong/createUser/",
        //       {
        //         username: account.login,
        //         email: account.email,
        //       },
        //       {
        //         headers: {
        //           "X-CSRFTOKEN": "csrftoken",
        //         },
        //       }
        //     )
        //     .then((res) => {
        //       console.log(res);
        //     });
        // } catch (error) {
        //   console.log(error);
        // }
        return true;
      }
      return false;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
