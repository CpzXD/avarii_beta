const REPORT_CATEGORIES = Object.freeze([
  Object.freeze({ value: 'bec ars', label: 'Bec ars' }),
  Object.freeze({ value: 'stalp defect', label: 'Stâlp defect' }),
  Object.freeze({ value: 'stalp cazut', label: 'Stâlp căzut' }),
  Object.freeze({ value: 'cablu expus', label: 'Cablu expus / căzut' }),
  Object.freeze({ value: 'zona intunecata', label: 'Zonă întunecată' }),
  Object.freeze({ value: 'panou defect', label: 'Panou de control defect' }),
  Object.freeze({ value: 'altele', label: 'Altele' }),
]);

const ACCEPTED_REPORT_CATEGORY_VALUES = Object.freeze([
  ...REPORT_CATEGORIES.map((category) => category.value),
  'nespecificat',
]);

module.exports = { REPORT_CATEGORIES, ACCEPTED_REPORT_CATEGORY_VALUES };
