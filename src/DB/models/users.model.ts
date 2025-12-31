import mongoose, { Types } from "mongoose";
import { Hash } from "../../utilities/hash";

export interface IUser {
  fName: string;
  lName: string;
  userName?: string | undefined;
  gender: string;
  role?: string | undefined;
  password: string;
  email: string;
  age: number;
  phone?: string | undefined;
  address: string;
  image?:string | undefined
  otp?:string | undefined
  changeCredentials:Date
  provider?:providerType | undefined
  confirmed?:boolean | undefined
  isTwoFAEnabled: boolean;
  verify_otp?: string |undefined;
  verify_otp_expire?: Date |undefined;
  login_otp?: string |undefined;
  login_otp_expire?: Date |undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
  profileImage?:string
  tempProfileImage?:string
  deletedAt:Date
  deletedBy:Types.ObjectId
  restoreBy:Types.ObjectId
  restoreAt:Date
  friends?:Types.ObjectId[]
  blocked:Types.ObjectId[] 
}
export enum genderType {
  male = "male",
  female = "female",
}


export enum roleType {
  user = "user",
  admin = "admin",
  superAdmin = "superAdmin",
}
export enum providerType{
  system= "system", 
  google="google"
}

const userSchema = new mongoose.Schema<IUser>(
  {
    fName: { type: String, minLength: 2, maxlength: 10, trim: true },
    lName: { type: String, minLength: 2, maxlength: 10, trim: true },
    email: { type: String, unique: true, trim: true },
    gender: {
      type: String,
      enum: genderType,
      required: true,
    },
    image:{type:String} ,
    confirmed:{type:Boolean, default:false
     },
     provider:{type :String , enum:providerType ,default:providerType.system},
    password: { type: String, required: function (){
     return this.provider === providerType.system ? true : false ;
    }
   },
    otp:{type:String },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    age: { type: Number, min: 18, max: 60, required: function(){
      return this.provider === providerType.system ? true :false ; 
    }
   },
    role: { type: String, enum: roleType, default: roleType.user },
    isTwoFAEnabled: { type: Boolean, default: false },
    verify_otp: String,
    verify_otp_expire: Date,
    login_otp: String,
    login_otp_expire: Date,
    profileImage:{type:String },
    tempProfileImage:{type:String },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt:{type:Date },
    restoreBy:{type:mongoose.Schema.Types.ObjectId , ref:"User"},
    restoreAt:{type:Date },
    friends:[{type:mongoose.Schema.Types.ObjectId , ref:"User"}] ,
    blocked :[{type :mongoose.Schema.Types.ObjectId , ref:"User"}]
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

userSchema
  .virtual("userName")
  .set(function (val) {
    const [fName, lName] = val.split(" ");
    this.set({ fName, lName });
  })
  .get(function () {
    return this.fName + " " + this.lName;
  });



  userSchema.pre ("save" , async function (next){
    if(!this.isModified("password")){
      return next();
    }
    this.password = await Hash(this.password);
     next();
  })

const userModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
  export default userModel;
