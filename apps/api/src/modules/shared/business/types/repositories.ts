export interface ISaveParams<DefaultType, PartialType> {
  createData?: DefaultType
  updateData?: DefaultType | PartialType
  id?: string
}
