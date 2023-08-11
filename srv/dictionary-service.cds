using {irregular.verbs.main as main} from '../db/schema';

@cds.query.limit: {
  default: 10,
  max    : 100
}
service DictionaryService {
  entity Dictionary as projection on main.Dictionary excluding {
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy
  } order by
    base asc;
}
