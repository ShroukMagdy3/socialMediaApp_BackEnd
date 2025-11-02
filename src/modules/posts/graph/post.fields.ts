import { graphql, GraphQLList, GraphQLString } from "graphql";
import postsService from "../posts.service";
import { postType } from "./post.types";
import { likePostArgs } from "./post.args";

class PostFields {
  constructor() {}

  query = () => {
    return {
      getPosts: {
        type:new GraphQLList(postType) ,
        resolve:postsService.getPosts
      },
    };
  };

  mutation= ()=>{
    return {
      likePost :{
        type : postType,
        args:likePostArgs,
        resolve:postsService.likePostGQL
      }
    }
  }
  
}

export default new PostFields();
