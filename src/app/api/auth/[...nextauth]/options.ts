import {NextAuthOptions} from 'next-auth'
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User';

export const authOptions : NextAuthOptions = {
    providers : [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text",},
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials : any) : Promise<any> {

                await dbConnect()
                try {
                    const user = await UserModel.findOne({
                        $or : [
                            {email : credentials.identifier},
                            {username : credentials.identifier},
                            
                        ]
                    })

                    if(!user){
                        throw new Error("No user found")
                    }

                    if(!user.isVerified){
                        throw new Error("Verify your account before login")
                    }

                    const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password)

                    if(isPasswordCorrect){
                        return user;
                    } else{
                        throw new Error("Incorrect password")
                    }

                } catch (err : any) {
                    throw new Error(err)
                }
            }
        }),
    ],
    callbacks : {
        
        async session({ session, token }) {
            if(token){
                session.user._id = token._id
                session.user.username = token.username
                session.user.isVerified = token.isVerified
                session.user.isAcceptingMessages = token.isAcceptingMessages
            }
            return session

        },

        async jwt({ token, user}) {
            if(user){
                token._id = user._id?.toString()
                token.isVerified = user.isVerified
                token.isAcceptingMessages = user.isAcceptingMessages
                token.username = user.username
            }

            return token
        }
    },
    pages : {
        signIn: '/signIn',
    },
    session : {
        strategy : "jwt"
    },
    secret : process.env.NEXT_AUTH_SECRET
}