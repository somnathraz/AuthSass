# Safe GraphQL Queries and Mutations

This document provides GraphQL queries and mutations that avoid the ID serialization errors with complex nested objects.

## Safe App Creation Mutation

```graphql
mutation CreateApp($input: CreateAppInput!) {
  createApp(input: $input) {
    success
    app {
      id
      name
      description
      type
      owner {
        id
        username
        email
      }
      memberCount
      userRole
      createdAt
    }
    errors {
      message
      code
      field
    }
  }
}
```

## Safe My Apps Query

```graphql
query MyApps {
  myApps {
    id
    name
    description
    type
    owner {
      id
      username
      email
    }
    memberCount
    userRole
    createdAt
  }
}
```

## Add App Member Mutation

```graphql
mutation AddAppMember($input: AddAppMemberInput!) {
  addAppMember(input: $input) {
    success
    app {
      id
      name
      members {
        id
        username
        email
      }
      memberCount
    }
    errors {
      message
      code
      field
    }
  }
}
```

## Remove App Member Mutation

```graphql
mutation RemoveAppMember($input: RemoveAppMemberInput!) {
  removeAppMember(input: $input) {
    success
    app {
      id
      members {
        id
        username
        email
      }
      memberCount
    }
    errors {
      message
      code
      field
    }
  }
}
```

## Technical Explanation

The GraphQL serialization errors occur because MongoDB ObjectId objects are being returned directly in ID fields rather than being converted to strings. Fields that commonly cause this issue:

1. `organizationId` field in the App type
2. `owner.id` fields in nested objects

The above queries avoid requesting these problematic fields directly or ensure they're properly serialized by the schema. 