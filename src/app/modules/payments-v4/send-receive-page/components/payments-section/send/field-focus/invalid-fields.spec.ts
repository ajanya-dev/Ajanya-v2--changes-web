import { FormControl, FormGroup, Validators } from '@angular/forms';
import { firstInDocumentOrder, invalidControlKeys } from './invalid-fields';

describe('invalidControlKeys', () => {
  it('lists every invalid control, core keys in reading order then details', () => {
    const core = {
      payee: new FormControl(null, Validators.required),
      amount: new FormControl('', Validators.required),
      payAs: new FormControl('wallet')
    };
    const details = new FormGroup({
      interBankAc: new FormControl(null, Validators.required),
      recipientType: new FormControl(null, Validators.required),
      memo: new FormControl('ok')
    });

    expect(invalidControlKeys(core, ['amount', 'payee', 'payAs'], details)).toEqual([
      'amount',
      'payee',
      'interBankAc',
      'recipientType'
    ]);
  });

  it('returns an empty list when everything is valid', () => {
    const core = { amount: new FormControl('10', Validators.required) };
    const details = new FormGroup({ memo: new FormControl('') });

    expect(invalidControlKeys(core, ['amount'], details)).toEqual([]);
  });

  it('tolerates a missing details form', () => {
    const core = { amount: new FormControl('', Validators.required) };

    expect(invalidControlKeys(core, ['amount'], null)).toEqual(['amount']);
  });
});

describe('firstInDocumentOrder', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.innerHTML = `
      <section id="top"><div id="a"></div></section>
      <section id="panel"><div id="b"></div><div id="c"></div></section>
    `;
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('picks the element that appears first on the page, not first in the list', () => {
    const b = root.querySelector<HTMLElement>('#b')!;
    const a = root.querySelector<HTMLElement>('#a')!;
    const c = root.querySelector<HTMLElement>('#c')!;

    const picked = firstInDocumentOrder([
      { key: 'b', el: b },
      { key: 'c', el: c },
      { key: 'a', el: a }
    ]);

    expect(picked?.key).toBe('a');
  });

  it('returns undefined for an empty list', () => {
    expect(firstInDocumentOrder([])).toBeUndefined();
  });

  it('keeps the first entry when two resolve to the same element', () => {
    const a = root.querySelector<HTMLElement>('#a')!;

    const picked = firstInDocumentOrder([
      { key: 'purposeCategory', el: a },
      { key: 'purpose', el: a }
    ]);

    expect(picked?.key).toBe('purposeCategory');
  });
});
