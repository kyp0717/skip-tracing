# Case detail table

## How to scrape case detail from CT Judicial website
1. Case detail url (much inject docket number)
- https://civilinquiry.jud.ct.gov/CaseDetail/PublicCaseDetail.aspx?DocketNo={docket number}
2. In Case Detail web page:
- Parse the property address for address, town, state and zip
- The property address can be found at this html id tag: ctl00_ContentPlaceHolder1_CaseDetailBasicInfo1_PropAddressRow
- Populate the fields address, town, state, and zip in the case detail table
- do not put default value
- Extract D-01 to D-05.  Populate the corresponding columns in case detail table.

