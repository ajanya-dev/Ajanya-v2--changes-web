/**
 * Single source of truth for the explanatory text shown in
 * Settings -> App Settings -> Application Settings -> Default Screen.
 *
 * The wording is shared by the v3 and v4 panels, their tab order previews and
 * the specs that assert on them, so it cannot drift between versions. Only the
 * route to the Check screen differs: v3 reaches it from the Payments sidebar
 * item, while v4 nests it under Payables -> Payments Out.
 */
const buildTabOrderText = (checkScreenPath: string) =>
  ({
    sectionDescription: `Choose which tabs show in ${checkScreenPath}, and what order they appear in.`,
    availableSubtitle:
      'Tabs that are not shown on the Check screen. Drag a tab here to hide it.',
    selectedSubtitle:
      'Tabs that are shown on the Check screen. The tab at the top of this list appears first on the left.',
    previewLabel: 'Preview: Check filter tabs',
    emptySelected:
      'No tabs are selected. The Check screen will have no filter tabs.',
    defaultTabMissing:
      'The default tab is not selected above, so no default tab will be shown.',
    tooltips: {
      loginLandingPage: 'Chooses the first page shown after a user signs in.',
      defaultPrintingStyle:
        'Chooses the printing style used by default when checks are printed.',
      defaultCheckListTab: `Chooses the Check tab selected by default in ${checkScreenPath}. It must be present in Selected Tabs to be shown.`,
      tabOrder: `Controls which tabs appear in ${checkScreenPath}. Selected tabs are shown; their top-to-bottom order becomes left-to-right order.`
    }
  }) as const;

export type TabOrderText = ReturnType<typeof buildTabOrderText>;

/** v3 reaches the check list from the Payments sidebar item. */
export const TAB_ORDER_TEXT_V3 = buildTabOrderText('Payments → Check');

/** v4 nests the check list under Payables -> Payments Out. */
export const TAB_ORDER_TEXT_V4 = buildTabOrderText(
  'Payables → Payments Out → Check'
);
