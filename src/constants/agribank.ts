export const BRANCHES = {
  '4600': 'Hội sở',
  '4601': 'Thành phố Tuy Hòa',
  '4602': 'Tuy An',
  '4603': 'Sông Cầu',
  '4604': 'Đồng Xuân',
  '4605': 'Sơn Hòa',
  '4606': 'Sông Hinh',
  '4607': 'Nam Tuy Hòa',
  '4608': 'Phú Hòa',
  '4609': 'Đông Hòa',
  '4610': 'Tây Hòa',
} as const;

export const ACCOUNT_TYPES = {
  '851101': 'Lương V1',
  '851102': 'Lương V2',
  '462001': 'Tạm treo lương',
  '484101': 'Khen thưởng',
  '484201': 'Phúc lợi/Độc hại',
  '484301': 'BHXH/Từ thiện',
} as const;

export type BranchCode = keyof typeof BRANCHES;
export type AccountTypeCode = keyof typeof ACCOUNT_TYPES;

export const getBranchName = (accountNumber: string) => {
  const code = accountNumber.substring(0, 4);
  return BRANCHES[code as BranchCode] || 'Chi nhánh khác';
};

export const getBranchCode = (accountNumber: string) => {
  return accountNumber.substring(0, 4);
};
