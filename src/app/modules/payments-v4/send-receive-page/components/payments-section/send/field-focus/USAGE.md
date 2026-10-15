# field-focus — inline validation focus & shake

Replaces "failed submit → dialog/alert" with "failed submit → scroll to the offending
field, focus its input, shake it, show a message underneath".

Four pieces, all self-contained (Angular only, no imports from `send-payment/` or
`send-payments-compact/`):

| File | Export | Role |
| --- | --- | --- |
| `field-focus.registry.ts` | `FieldFocusRegistry` | root singleton: `key -> HTMLElement` map |
| `sp-focus-anchor.directive.ts` | `SpFocusAnchorDirective` | registers an element under a key |
| `shake.ts` | `focusField`, `shakeElement` | the imperative primitives |
| `sp-shake-on.directive.ts` | `SpShakeOnDirective` | declarative shake driven by a signal value |

---

## 1. Marking a field — `SpFocusAnchorDirective`

**Selector:** `[spFocusAnchor], [data-field]` — it matches on **either** attribute, so in
practice you just write `data-field` and the element is registered automatically.

**Key resolution** (in the constructor, once):

```
key = el.getAttribute('spFocusAnchor') || el.getAttribute('data-field')
```

If neither attribute is present (or is empty) the directive does nothing.

**`data-field` must be a plain static string attribute** — not a binding:

* `data-field="amount"` — correct.
* `[attr.data-field]="key"` — **does not work.** The attribute is read once in the
  constructor, and a property/attribute binding is not present in the DOM at that time.

Choose the key to be either:

* the `formControlName` of the control inside the wrapper (best — the component fallback
  below then works even where an anchor is missing), or
* a stable logical name for a non-form region (`"payee"`, `"method"`, `"recurring"`).

Keys must be **unique per rendered page**. The registry is a flat `Map`; a second
registration of the same key overwrites the first. The unregister closure is
`DestroyRef`-scoped and only deletes the entry if it still points at that same element,
so an anchor destroyed after a re-register does not clobber the live one.

Put the attribute on the **wrapper** (label + control + error message), not the bare
`<input>` — the shake then moves the whole field group, and `focusField` still finds the
input inside it.

## 2. Focusing on submit — `focusField` / `shakeElement`

`focusField(el)` scrolls `el` into view (`smooth`, `block: 'center'`), then focuses the
element itself if it matches `input, textarea, select`, otherwise the first such
descendant, with `preventScroll: true`.

`shakeElement(el)` runs a 500ms horizontal Web Animations shake and returns the
`Animation`, or `null` when `prefers-reduced-motion: reduce` is set or `el.animate` is
unavailable.

Neither function throws on a detached element; both are safe to call from an
`afterNextRender` callback.

The component-side call must be deferred until after the failing message/state has
rendered — otherwise the layout shifts under the smooth scroll. Use `afterNextRender`
with an explicit `Injector`.

## 3. Declarative shake — `SpShakeOnDirective`

**Selector:** `[spShakeOn]`. **Input:** `spShakeOn: unknown` (signal input).

Behaviour: an `effect` reads the value; the **first** run is swallowed (priming), and
after that the host shakes only when the value **both changed and is truthy**.

Use it for elements that are not form controls — a "Missing info" warning button, a
banner — where the trigger is naturally a derived value rather than a submit action.
Feed it a `computed()` that produces a *different* string each time you want a shake.

> Important: identical consecutive values do **not** re-shake. If you need "shake again on
> every failed submit", the value must change each time — append a monotonically
> increasing sequence number to it, e.g.
> `computed(() => missingKeys().join(',') + '#' + failSeq())`.

## 4. Wiring, end to end

Component:

```ts
import { afterNextRender, Component, ElementRef, effect, inject, Injector, signal } from '@angular/core';
import { FieldFocusRegistry } from './field-focus/field-focus.registry';
import { SpFocusAnchorDirective } from './field-focus/sp-focus-anchor.directive';
import { SpShakeOnDirective } from './field-focus/sp-shake-on.directive';
import { focusField, shakeElement } from './field-focus/shake';

@Component({
  standalone: true,
  imports: [SpFocusAnchorDirective, SpShakeOnDirective /* , ... */],
  templateUrl: './send.component.html'
})
export class SendComponent {
  private readonly registry = inject(FieldFocusRegistry);
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

  readonly fieldToFocus = signal<string | null>(null);
  readonly fieldFocusSeq = signal(0);

  constructor() {
    effect(() => {
      const seq = this.fieldFocusSeq();
      if (!seq) return;
      const key = this.fieldToFocus();
      if (!key) return;
      afterNextRender(() => this.focusInvalidField(key), { injector: this.injector });
    });
  }

  submit(): void {
    const bad = this.firstInvalidKey();
    if (bad) {
      this.fieldToFocus.set(bad);
      this.fieldFocusSeq.update((v) => v + 1);
      return;
    }
    // ... real submit
  }

  private focusInvalidField(key: string): void {
    const el =
      this.registry.resolve(key) ??
      (this.hostEl.nativeElement as HTMLElement).querySelector<HTMLElement>(
        `[formcontrolname="${key}"]`
      );
    if (!el) return;
    focusField(el);
    shakeElement(el);
  }
}
```

The `fieldFocusSeq` counter is what makes a *repeated* failure on the *same* field fire
again — the effect would otherwise not re-run when `fieldToFocus` is unchanged. Always
bump the sequence, and always set the key before bumping it.

`focusInvalidField` falls back to `[formcontrolname="<key>"]` within the host when no
anchor is registered, so a control whose wrapper lacks `data-field` still works as long as
the key equals its `formControlName`.

Template:

```html
<div class="field" data-field="amount">
  <label for="amt">Amount</label>
  <input id="amt" formControlName="amount" />
  @if (showAmountError()) {
    <p class="sp-field-err">Enter an amount.</p>
  }
</div>

<div class="field" data-field="payee">
  <label>Payee</label>
  <app-payee-picker />
  @if (missingPayeeFields().length) {
    <button type="button" [spShakeOn]="missingPayeeKey()" (click)="openPayeeMissing()">
      Missing info — add
    </button>
  }
</div>
```

## 5. Gotchas

* The directive **must** be listed in the component's `imports`. `data-field` on an
  element inside a child component's own template registers only if *that* child imports
  `SpFocusAnchorDirective`.
* Because the selector includes `[data-field]`, every `data-field` attribute in a
  template of an importing component becomes an anchor. That is intentional — but it also
  means `data-field` is now a reserved attribute in those templates; do not use it for
  unrelated purposes.
* Anchors on elements inside `@if` / `@defer` blocks only exist while rendered. Resolve
  returns `undefined` for a collapsed section — expand the section first, then focus in
  `afterNextRender`.
* `shakeElement` cancels any animation already running on the element before starting,
  so back-to-back calls restart the shake rather than overlapping.
