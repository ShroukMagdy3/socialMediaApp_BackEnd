import { graphql, GraphQLList, GraphQLString } from "graphql";
import usersService from "../users.service";
import { userType } from "./user.types";
import { createUserArgs } from "./args";

class UserFields {
  constructor() {}

  query = () => {
    return {
      hello: {
        type: GraphQLString,
        resolve: usersService.sayHi
      },



    };
  };




  mutation =()=>{

    return {
        createUser :{
            type: userType,
            args: createUserArgs,
            resolve:usersService.createUser
        },
        
    }
  }
}



export default new UserFields();