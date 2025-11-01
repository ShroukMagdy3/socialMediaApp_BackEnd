import {
  DeleteResult,
  HydratedDocument,
  Model,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
  UpdateQuery,
  UpdateWriteOpResult,
} from "mongoose";

export class DbRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}
  async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
    return await this.model.create(data);
  }

  async findOne(
    filter: RootFilterQuery<TDocument>,
    select?: ProjectionType<TDocument>,
     options?: QueryOptions<TDocument>
  ): Promise<HydratedDocument<TDocument> | null> {
   return await this.model.findOne(filter , select, options);
     
  }
    async find ({
      filter,
      projection ,
      options
    }:
   {   filter: RootFilterQuery<TDocument>,
    projection?: ProjectionType<TDocument> , 
    options?:QueryOptions<TDocument>}
  ):Promise<HydratedDocument<TDocument>[]>{
    return await this.model.find(filter , projection , options);
  }
  async paginate({
  filter,
  projection,
  options,
  query
}: {
  filter: RootFilterQuery<TDocument>;
  projection?: ProjectionType<TDocument>;
  options?: QueryOptions<TDocument>;
  query: { page: number; limit: number };
}) {

  let { page, limit } = query;
  if (page <= 0) page = 1;
  page = page * 1 || 1;
  const skip = (page - 1) * limit;

  const finalOptions = {
    ...options,
    skip,
    limit
  };
  const numberOfDocument = await this.model.countDocuments({deletedAt:{$exists:false}});
  const numberOfPages =Math.ceil( numberOfDocument /limit );
  const docs =  await this.model.find(filter, projection, finalOptions);
  return{docs , currentPage:page , numberOfDocument , numberOfPages}
}
  async updateOne(
    filter: RootFilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
  ): Promise<UpdateWriteOpResult | null> {
    return await this.model.updateOne(filter, update);
  }
   async findOneAndUpdate(
    filter: RootFilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
    option:QueryOptions<TDocument> | null = {new :true}
  ): Promise<HydratedDocument<TDocument> | null> {
    return await this.model.findOneAndUpdate(filter, update , option);
  }
   async deleteOne(
    filter: RootFilterQuery<TDocument>, 
  ): Promise<DeleteResult | null> {
    return await this.model.deleteOne(filter);
  }




}
