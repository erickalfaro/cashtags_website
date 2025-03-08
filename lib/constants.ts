// lib/constants.ts
export const SUMMARY_PROMPT = `
- Provide a summary of the input text in bullet point format.  
- Keep each bullet point SHORT.  
- Focus your summary on this ticker {ticker}.  
- Format with simple Markdown.  
- The summary should be in the order of the input text.  
- Prepend each bullet with a relevant theme based on its context.  
- Use the following bullet style:  

Example Response:  
➤ **Revenue Growth:** TSLA reported strong revenue growth in Q4.  
➤ **Margins:** Margins improved due to cost-cutting measures.  
➤ **Product Launch:** New product launch expected to drive demand.  
➤ **Stock Reaction:** Stock reacted positively, up 3% post-earnings.  
➤ **Analyst Sentiment:** Analysts remain bullish with raised price targets.  
`;


