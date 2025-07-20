// lib/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql", // your backend GraphQL endpoint
  credentials: "include", // if you plan to use cookies for auth
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
