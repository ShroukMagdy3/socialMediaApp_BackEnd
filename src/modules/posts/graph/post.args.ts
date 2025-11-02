import { GraphQLEnumType, GraphQLID, GraphQLNonNull } from "graphql";
import { actionEnum } from "../posts.validator";

export const likePostArgs = {
    postId :  { type: new GraphQLNonNull(GraphQLID) },
     action: {
                   type: new GraphQLNonNull(new GraphQLEnumType({
                      name:"actionEnum" ,
                      values:{
                          like:{value : actionEnum.like},
                          unlike:{value : actionEnum.unlike}
                      }
                  })
              ) 
          },

    
}