"use client";

import { useQuery } from "@apollo/client";
import { GET_USER_ORGANIZATIONS, GET_ME } from "@/graphql/queries";

export default function TestGraphQLQuery() {
  const { data: meData, loading: meLoading, error: meError } = useQuery(GET_ME);
  const { data: orgsData, loading: orgsLoading, error: orgsError } = useQuery(GET_USER_ORGANIZATIONS);

  console.log("GET_ME Query:", {
    data: meData,
    loading: meLoading,
    error: meError?.message,
    networkError: meError?.networkError,
    graphQLErrors: meError?.graphQLErrors
  });

  console.log("GET_USER_ORGANIZATIONS Query:", {
    data: orgsData,
    loading: orgsLoading,
    error: orgsError?.message,
    networkError: orgsError?.networkError,
    graphQLErrors: orgsError?.graphQLErrors
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">GraphQL Query Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">GET_ME Query</h2>
        {meLoading && <p>Loading...</p>}
        {meError && <p className="text-red-500">Error: {meError.message}</p>}
        {meData && (
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(meData, null, 2)}
          </pre>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">GET_USER_ORGANIZATIONS Query</h2>
        {orgsLoading && <p>Loading...</p>}
        {orgsError && <p className="text-red-500">Error: {orgsError.message}</p>}
        {orgsData && (
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(orgsData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
} 