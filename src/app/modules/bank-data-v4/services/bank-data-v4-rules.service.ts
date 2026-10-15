import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IApiRes } from 'src/app/models/api';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';

/**
 * Tuple shape returned by the v3 `/bank-data/rules` endpoint:
 *   [ id, conditionHtml, actionHtml ]
 * The condition/action descriptions are pre-rendered HTML strings.
 */
export type TBankDataV4RuleTuple = [string, string, string];

export interface IBankDataV4RuleCondition {
  /** condition kind — kept open since the modal may evolve */
  type: string;
  [key: string]: unknown;
}

export interface IBankDataV4RuleAction {
  type: string;
  [key: string]: unknown;
}

export interface IBankDataV4RuleData {
  ifs: IBankDataV4RuleCondition[];
  thens: IBankDataV4RuleAction[];
}

export interface IBankDataV4CreateRulePayload {
  name: string;
  description?: string;
  rule_type: number; // 1 = regular, 2 = split (Banker-Data)
  rule_data: string; // JSON.stringify(IBankDataV4RuleData)
}

@Injectable({ providedIn: 'root' })
export class BankDataV4RulesService {
  private http = inject(HttpClient);
  private bankDataService = inject(BankDataService);
  private readonly rootUrl = environment.rootUrl;

  /** Raw rule tuples [id, conditionHtml, actionHtml]. */
  readonly rules = signal<TBankDataV4RuleTuple[]>([]);
  readonly isLoading = signal(false);

  /** Quick computed view-models for cards. */
  readonly cards = computed(() =>
    this.rules().map((r, idx) => ({
      id: r?.[0] ?? '',
      conditionHtml: r?.[1] ?? '',
      actionHtml: r?.[2] ?? '',
      index: idx
    }))
  );

  loadRules(): void {
    this.isLoading.set(true);
    this.bankDataService
      .getMyRules()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (res?.success) {
          this.rules.set(
            (res.data?.rules_data as TBankDataV4RuleTuple[]) ?? []
          );
        }
      });
  }

  /** Silently refresh rules without showing loading spinner. */
  refreshRules(): void {
    this.bankDataService.getMyRules().subscribe((res) => {
      if (res?.success) {
        this.rules.set((res.data?.rules_data as TBankDataV4RuleTuple[]) ?? []);
      }
    });
  }

  deleteRule(id: string): Observable<IApiRes<unknown>> {
    return this.bankDataService.deleteRule(id);
  }

  removeRule(id: string): void {
    this.rules.update((list) => list.filter((r) => r[0] !== id));
  }

  reapplyAll(): Observable<IApiRes<unknown>> {
    return this.bankDataService.reapplyRules();
  }

  createRule(
    payload: IBankDataV4CreateRulePayload
  ): Observable<IApiRes<unknown>> {
    const ruleData = JSON.parse(payload.rule_data);
    const body = new FormData();
    body.append(
      'name',
      JSON.stringify({ style: payload.rule_type, ...ruleData })
    );
    return this.http.post<IApiRes<unknown>>(
      `${this.rootUrl}/bank-data/rules`,
      body
    );
  }

  /** Fetch a single rule with structured rule_data — needed for the edit modal. */
  getRule(id: string): Observable<IApiRes<IBankDataV4StoredRule>> {
    return this.http.get<IApiRes<IBankDataV4StoredRule>>(
      `${this.rootUrl}/bank-data/rule/${id}`
    );
  }

  /** Update an existing rule. The endpoint expects the id inside the body. */
  updateRule(
    id: string,
    payload: IBankDataV4CreateRulePayload
  ): Observable<IApiRes<unknown>> {
    return this.http.put<IApiRes<unknown>>(
      `${this.rootUrl}/bank-data/update-rule`,
      { ...payload, id, reapply_rule: 1 }
    );
  }
}

/** Stored rule shape returned by GET /bank-data/rule/:id. */
export interface IBankDataV4StoredRule {
  id: string;
  name?: string;
  description?: string;
  rule_type?: number;
  /** JSON string of `{ ifs, thens }` */
  rule_data?: string;
}
