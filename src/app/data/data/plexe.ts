export class QuestionSection {
  static questionAnswerList(): { qst: string; ans: string }[] {
    return [
      {
        qst: 'Why is my available funds negative?',
        ans: 'Your available limit is a dynamic limit which means it adjusts in line with the performance metrics of your business. In some situations, your available limit can reduce below the available funds resulting in negative available funds. Once business metrics improve your available funds will adjust.'
      },
      {
        qst: 'What is the monthly fee?',
        ans: 'Fees in advance are calculated weekly and applied to your loan balance at the end of each calendar month. Your regular weekly loan payments pay off the principal balance meaning you do not need to manually pay any fees. The monthly fee is simply an accounting entry recorded at the end of each calendar month to reflect the cost of funding /advance fee component of your loan repayments for that month; it is not an additional cost to you. This advance fee component raised at the end of each month is already included in the weekly loan payments we receive from you, i.e., not an additional cost to you.'
      },
      {
        qst: 'What are the costs?',
        ans: 'The only fee applicable is your fee charged as a percentage of your repayment which is already included in your weekly payments. There are no other fees that apply.'
      },
      {
        qst: 'Why is my withdraw button disabled?',
        ans: 'Your withdraw button can be disabled if your business bank data feed is disconnected or your business performance has deteriorated.'
      }
    ];
  }
}
