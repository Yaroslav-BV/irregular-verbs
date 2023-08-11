using {
  cuid,
  managed
} from '@sap/cds/common';

namespace irregular.verbs.main;

type Word : String(30);

entity Dictionary : cuid, managed {
  base        : Word not null;
  past        : Word not null;
  participle  : Word default 'no';
  translation : Word not null;
}
