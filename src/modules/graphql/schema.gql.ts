import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import userFields from "../users/graphql/user.fields";
import postFields from "../posts/graph/post.fields";

export const schemaGQl = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
     ...userFields.query(),
     ...postFields.query()

    },
  }),
  mutation: new GraphQLObjectType({
    name:"mutation" ,
    fields:{
     ...userFields.mutation(),
     ...postFields.mutation()
    }
  })
});
