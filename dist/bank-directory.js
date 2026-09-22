// Manually reviewed official publications. This snapshot is not caller authentication.
export const DIRECTORY_REVIEWED_AT = '2026-09-22';
export const DIRECTORY_REVIEW_DUE = '2026-12-21';
export const CONTACT_TYPES = {
  care: 'Customer care · you call the bank',
  fraud: 'Fraud reporting · you call the bank',
  outbound: 'Published outgoing service number',
  promotional: 'Published outgoing promotional number'
};
const bank = (id, name, category, sourceUrl, numbers, extra = {}) => ({
  id, name, category, ...extra,
  contacts: numbers.map(item => {
    const [number, type = 'care', note = '', source = sourceUrl] = Array.isArray(item) ? item : [item];
    return { number, type, note, sourceUrl: source, checkedAt: DIRECTORY_REVIEWED_AT, reviewDue: DIRECTORY_REVIEW_DUE };
  })
});

export const BANK_DIRECTORY = [
  bank('sbi', 'State Bank of India (SBI)', 'Public sector', 'https://retail.sbi.bank.in/', ['18001234', '18002100']),
  bank('pnb', 'Punjab National Bank (PNB)', 'Public sector', 'https://www.pnb.bank.in/contact-centre.html', ['18001800', '18002021', '+911202490000']),
  bank('bob', 'Bank of Baroda', 'Public sector', 'https://bankofbaroda.bank.in/contact-us', ['18005700', '18005000', ['1600318160', 'outbound', 'Fraud alerts'], ['1600304190', 'outbound', 'Fraud alerts']]),
  bank('canara', 'Canara Bank', 'Public sector', 'https://www.canarabank.bank.in/pages/contactus', ['18001030', ['18001032', 'care', 'Pensioner support'], ['1600113311', 'outbound'], ['1600308296', 'outbound'], ['1600108140', 'outbound'], ['1600308061', 'outbound'], ['1600108090', 'outbound', 'Fraud risk monitoring']]),
  bank('union', 'Union Bank of India', 'Public sector', 'https://www.unionbankofindia.bank.in/en/common/contact-us', ['18008333', '18002333', ['18008332', 'fraud']]),
  bank('boi', 'Bank of India', 'Public sector', 'https://bankofindia.bank.in/customer-care', ['1800220229', '18001031906']),
  bank('bom', 'Bank of Maharashtra', 'Public sector', 'https://bankofmaharashtra.bank.in/contact-us', ['18002334526']),
  bank('central', 'Central Bank of India', 'Public sector', 'https://centralbank.bank.in/en/contact-us', ['18003030', ['18002031911', 'care', 'Pensioner support'], ['1600014040', 'outbound', '', 'https://www.centralbank.bank.in/'], ['1409983030', 'promotional', '', 'https://www.centralbank.bank.in/']]),
  bank('indian', 'Indian Bank', 'Public sector', 'https://indianbank.bank.in/en/quick-contact', ['18001700']),
  bank('iob', 'Indian Overseas Bank', 'Public sector', 'https://www.iob.bank.in/en/contact-centre-information', ['18008904445', '18004254445', ['1600118119', 'outbound'], ['1600318418', 'outbound'], ['1600100130', 'outbound'], ['1600300418', 'outbound']]),
  bank('psb', 'Punjab & Sind Bank', 'Public sector', 'https://www.punjabandsind.bank.in/content/contact', ['18004198300', ['1600313052', 'outbound', '', 'https://www.punjabandsind.bank.in/content/official-number'], ['1600303035', 'outbound', '', 'https://www.punjabandsind.bank.in/content/official-number']]),
  bank('uco', 'UCO Bank', 'Public sector', 'https://www.uco.bank.in/contact-us1', ['18008910']),

  bank('axis', 'Axis Bank', 'Private sector', 'https://www.axis.bank.in/comprehensive-notice-board/important-notices', ['18001035577']),
  bank('bandhan', 'Bandhan Bank', 'Private sector', 'https://bandhan.bank.in/contact-us', ['18002588181', '+913366333333']),
  bank('csb', 'CSB Bank', 'Private sector', 'https://netbanking.csb.co.in/?ojr=home', ['18002669090']),
  bank('cub', 'City Union Bank', 'Private sector', 'https://www.cityunionbank.com/hi-in/pre-qualified-unsecured-personal-loan', ['+914471225000']),
  bank('dcb', 'DCB Bank', 'Private sector', 'https://www.dcb.bank.in/customer-care/contact-us', ['+912268997777', '+914068157777']),
  bank('dhan', 'Dhanlaxmi Bank', 'Private sector', 'https://www.dhan.bank.in/customer-care/', ['+914442413000', ['1600308065', 'outbound']]),
  bank('federal', 'Federal Bank', 'Private sector', 'https://www.federal.bank.in/contact-center', ['18004251199', '18004201199']),
  bank('hdfc', 'HDFC Bank', 'Private sector', 'https://www.hdfc.bank.in/contact-us/customer-care', ['18001600', '18002600']),
  bank('icici', 'ICICI Bank', 'Private sector', 'https://www.icici.bank.in/customer-care', ['18001080', ['18002662', 'fraud'], ['1600313900', 'outbound', 'IVR transaction confirmation'], ['1600300900', 'outbound', 'IVR transaction confirmation'], ['1600317900', 'outbound', 'IVR transaction confirmation'], ['1600300800', 'outbound', 'Dispute updates'], ['1600315800', 'outbound', 'Dispute updates'], ['1600313800', 'outbound', 'Dispute updates']]),
  bank('idbi', 'IDBI Bank', 'Private sector', 'https://www.idbi.bank.in/customer-care-centre.aspx', ['18002094324', '1800221070']),
  bank('idfc', 'IDFC FIRST Bank', 'Private sector', 'https://www.idfcfirst.bank.in/customer-care', ['180010888']),
  bank('indusind', 'IndusInd Bank', 'Private sector', 'https://www.indusind.bank.in/in/en/personal/reach-us.html', [['18602677777', 'care', 'Call charges apply']]),
  bank('jk', 'Jammu & Kashmir Bank', 'Private sector', 'https://jkbank.com/grievance-redressal', ['18008902122']),
  bank('karnataka', 'Karnataka Bank', 'Private sector', 'https://moneyclick.kbl.bank.in/BankAwayRetail/AuthenticationController?ACTION.LOAD=Y&AuthenticationFG.LOGIN_FLAG=1&BANK_ID=KBL&FORMSGROUP_ID__=AuthenticationFG&__CALL_MODE__=56&__EVENT_ID__=LOAD&__START_TRAN_FLAG__=Y', ['18004251444']),
  bank('kvb', 'Karur Vysya Bank', 'Private sector', 'https://www.kvb.co.in/locate-us/branch/andhrapradesh/', [['18602581916', 'care', 'Call charges apply'], ['18005721916', 'fraud']]),
  bank('kotak', 'Kotak Mahindra Bank', 'Private sector', 'https://www.kotak.bank.in/en/customer-service/contact-us.html', ['18004100', ['18002090000', 'fraud']]),
  bank('nainital', 'Nainital Bank', 'Private sector', 'https://www.nainitalbank.bank.in/english/home.aspx', [['+918069840140', 'care', 'Non-ATM queries; check source for hours'], ['18001804031', 'fraud', 'ATM and unauthorized transactions'], ['1600308474', 'outbound'], ['1409269311', 'promotional']]),
  bank('rbl', 'RBL Bank', 'Private sector', 'https://www.rbl.bank.in/contact-us/customer-care', ['+912262327777']),
  bank('south', 'South Indian Bank', 'Private sector', 'https://www.southindianbank.com/content/viewContentLvl2.aspx?linkIdLvl2=16&linkid=129', ['18004251809', '18001029408']),
  bank('tmb', 'Tamilnad Mercantile Bank', 'Private sector', 'https://www.tmb.bank.in/contact-us', ['18004250426', '+919842461461', ['+914469297034', 'fraud'], ['1600318505', 'outbound'], ['1600303426', 'outbound']]),
  bank('yes', 'YES Bank', 'Private sector', 'https://www.yes.bank.in/sites/yesbank/digital-banking/whatsapp-banking', ['18001200']),

  bank('au', 'AU Small Finance Bank', 'Small finance', 'https://www.aubank.in/business-banking/digital-banking/online-banking', ['180012001200'], { aliases: 'Fincare' }),
  bank('capital', 'Capital Small Finance Bank', 'Small finance', 'https://www.capital.bank.in/contact-us', ['18001201600']),
  bank('equitas', 'Equitas Small Finance Bank', 'Small finance', 'https://equitas.bank.in/unauthorized-transaction/', ['18001031222', ['1600318008', 'outbound', 'Transaction monitoring; does not accept incoming calls'], ['+914471624173', 'outbound', 'International transaction monitoring; does not accept incoming calls']]),
  bank('esaf', 'ESAF Small Finance Bank', 'Small finance', 'https://www.esaf.bank.in/contact-us/', ['18001033723']),
  bank('jana', 'Jana Small Finance Bank', 'Small finance', 'https://www.jana.bank.in/grievance-redressal/', ['18002080', ['18004200', 'care', 'Microfinance support']]),
  bank('slice', 'slice Small Finance Bank', 'Small finance', 'https://slice.bank.in/contact-us', ['18001211905', '+918048329999'], { aliases: 'North East Small Finance Bank NESFB' }),
  bank('shivalik', 'Shivalik Small Finance Bank', 'Small finance', 'https://shivalik.bank.in/contact-us', ['18002025333']),
  bank('suryoday', 'Suryoday Small Finance Bank', 'Small finance', 'https://suryoday.bank.in/contact-us/', ['18002667711']),
  bank('ujjivan', 'Ujjivan Small Finance Bank', 'Small finance', 'https://www.ujjivansfb.bank.in/customer-care-support', ['18002082121']),
  bank('unity', 'Unity Small Finance Bank', 'Small finance', 'https://www.theunitybank.com/contact-us', ['18002091122']),
  bank('utkarsh', 'Utkarsh Small Finance Bank', 'Small finance', 'https://www.utkarsh.bank.in/help-and-support', ['18001239878', '18002081788']),

  bank('airtel', 'Airtel Payments Bank', 'Payments', 'https://www.airtelpayments.bank.in/help-and-support', ['180023400']),
  bank('ippb', 'India Post Payments Bank', 'Payments', 'https://ippbonline.bank.in/web/ippb/reach-us', [['155299', 'care', 'Short code; telecom charges apply'], '+913322029000', ['18008899860', 'fraud']]),
  bank('fino', 'Fino Payments Bank', 'Payments', 'https://www.fino.bank.in/support/contact-us', ['18002681000', ['18002683930', 'fraud']]),
  bank('jio', 'Jio Payments Bank', 'Payments', 'https://www.jiopayments.bank.in/contact-us/', ['18008907070']),
  bank('nsdl', 'NSDL Payments Bank', 'Payments', 'https://nsdlpayments.bank.in/contact_us.php', ['+912242022100', '+912269787301']),
];

export const BANK_NUMBERS = BANK_DIRECTORY.flatMap(b => b.contacts.map(c => ({
  ...c, bankId: b.id, bank: b.name, category: b.category, aliases: b.aliases || '',
  source: 'official', label: b.name, reason: CONTACT_TYPES[c.type] + (c.note ? ' · ' + c.note : ''),
  updatedAt: c.checkedAt, expiresAt: c.reviewDue
})));

// Kept outside active matches: a past contact is not a current banking endorsement.
export const DIRECTORY_NOTES = [
  { bank: 'State Bank of India (SBI)', number: '1600108333', note: 'User-supplied outgoing number. No supporting official publication was found during this review; excluded from official matches.', sourceUrl: 'https://sbi.bank.in/web/contact-us/contact-us' },
  { bank: 'Paytm Payments Bank', note: 'Excluded from the active bank directory: the published RBI notice cancels its banking licence effective 24 April 2026. This is separate from Paytm app services.', sourceUrl: 'https://www.paytm.bank.in/Information/RBI-cancels-Licence-of-Paytm-Payments-Bank-Limited-Bank.pdf' }
];
