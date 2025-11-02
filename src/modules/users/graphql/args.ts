import { GraphQLEnumType, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { genderType } from "../../../DB/models/users.model";

export const createUserArgs ={
        fName: { type: new GraphQLNonNull(GraphQLString) },
        lName: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        gender: {
                type: new GraphQLNonNull(new GraphQLEnumType({
                   name:"genderUser" ,
                   values:{
                       male:{value : genderType.male},
                       female:{value : genderType.female}
                   }
               })
           ) 
       },
        password: { type: new GraphQLNonNull(GraphQLString) },
        phone: { type: new GraphQLNonNull(GraphQLString) },
        address: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
}


