// eslint-disable-next-line @typescript-eslint/no-unused-vars
class CustomStatsToolPanel {
  eGui: any;
  init(params: any) {
    this.eGui = document.createElement('div');
    this.eGui.style.textAlign = 'center';

    // calculate stats when new rows loaded, i.e. onModelUpdated
    const renderStats = () => {
      this.eGui.innerHTML = this.calculateStats();
    };
    params.api.addEventListener('modelUpdated', renderStats);
  }
  getGui() {
    return this.eGui;
  }
  calculateStats() {
    const totalCredit = 0;
    const totalDebit = 0;
    const dateRange = '';
    //params.api.forEachNode(function (rowNode: any) {
    //  const data = rowNode.data;
    //  dateRange = 'All';
    //  if (data.operation == 1) totalCredit += data.amount;
    //  if (data.operation == 2) totalDebit += data.amount;
    //});

    return `
       <span>
           <h2><i class="fa fa-calculator"></i> Summary</h2>
           <dl style="font-size: large; padding: 30px 40px 10px 30px">
               <dt style="padding-bottom: 15px">Total Credit: <b>${totalCredit}</b></dt>
               <dt style="padding-bottom: 15px">Total Debit: <b>${totalDebit}</b></dt>
               <dt style="padding-bottom: 15px">Date Range: <b>${dateRange}</b></dt>
           </dl>
       </span>`;
  }
}
