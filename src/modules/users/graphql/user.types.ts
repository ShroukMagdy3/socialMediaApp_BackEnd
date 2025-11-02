import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { genderType } from "../../../DB/models/users.model";

export const userType = new GraphQLObjectType({
  name: "user",
  fields: {
    _id: { type: new GraphQLNonNull(GraphQLID) },
    fName: { type: new GraphQLNonNull(GraphQLString) },
    lName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    gender: {
         type: new GraphQLNonNull(new GraphQLEnumType({
            name:"gender" ,
            values:{
                male:{value : genderType.male},
                female:{value : genderType.female},
            }
        })
    ) 
},
    confirmed: { type: new GraphQLNonNull(GraphQLBoolean) },
    provider: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    otp: { type: new GraphQLNonNull(GraphQLString) },
    phone: { type: new GraphQLNonNull(GraphQLString) },
    address: { type: new GraphQLNonNull(GraphQLString) },
    age: { type: new GraphQLNonNull(GraphQLInt) },
    role: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    updatedAt: { type: new GraphQLNonNull(GraphQLString) },
    restoreAt: { type: new GraphQLNonNull(GraphQLString) },
    restoreBy: { type: new GraphQLNonNull(GraphQLID) },
    friends: { type: new GraphQLNonNull(new GraphQLList(GraphQLID)) },
  },
});
