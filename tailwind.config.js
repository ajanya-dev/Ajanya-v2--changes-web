module.exports = {
  mode: "jit",
  content: ["./src/**/*.{html,ts,css,scss,sass,less,style}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      "main-background-color": "var(--main-background-color)",
      "secondary-background-color": "var(--secondary-background-color)",
      "tertiary-background-color": "var(--tertiary-background-color)",
      "input-border-color": "var(--input-border-color)",
      "main-text-color": "var(--main-text-color)",
      "secondary-text-color": "var(--secondary-text-color)",
      "common-blue-color": "var(--common-blue-color)",
      "common-green-color": "var(--common-green-color)",
      "common-violet-color": "var(--common-violet-color)",
      "common-yellow-color": "var(--common-yellow-color)",
      "common-red-color": "var(--common-red-color)",
      "common-secondary-blue-color": "var(--common-secondary-blue-color)",
      "common-secondary-green-color": "var(--common-secondary-green-color)",
      "common-secondary-violet-color": "var(--common-secondary-violet-color)",
      "common-secondary-yellow-color": "var(--common-secondary-yellow-color)",
      "common-secondary-red-color": "var(--common-secondary-red-color)",
      "common-tertiary-blue-color": "var(--common-tertiary-blue-color)",
      "common-tertiary-green-color": "var(--common-tertiary-green-color)",
      "common-tertiary-yellow-color": "var(--common-tertiary-yellow-color)",
      "common-tertiary-violet-color": "var(--common-tertiary-violet-color)",
      "common-dark-blue-color": "var(--common-dark-blue-color)",
      "common-sidebar-color": "var(--common-sidebar-color)",
      "sidebar-feature-button-color": "var(--sidebar-feature-button-color)",
      "ottimate-color": "var(--ottimate-color)",
      "sidebar-selection-color": "var(--sidebar-selection)",
      "sidebar-hover-color": "var(--sidebar-hover)",
      "sidebar-branch-color": "var(--sidebar-branch)",
      white: "#FFFFFF",

      /* V4 Colors */
      "v4-primary-brand-color": "var(--v4-primary-brand-color)",
      "v4-brand-tint":
        "color-mix(in srgb, var(--v4-primary-brand-color) 10%, transparent)",
      "v4-brand-tint-strong":
        "color-mix(in srgb, var(--v4-primary-brand-color) 20%, transparent)",
      "v4-hover-tint":
        "color-mix(in srgb, var(--v4-main-text-color) 5%, transparent)",
      "v4-cta-banner-bg-color": "var(--v4-cta-banner-bg-color)",
      "v4-cta-banner-circle-color": "var(--v4-cta-banner-circle-color)",
      "v4-primary-brand-bold-color": "var(--v4-primary-brand-bold-color)",
      "v4-secondary-brand-color": "var(--v4-secondary-brand-color)",
      "v4-brand-border-color": "var(--v4-brand-border-color)",
      "v4-brand-focus-color": "var(--v4-brand-focus-color)",
      "v4-accent-violet-color": "var(--v4-accent-violet-color)",
      "v4-common-sky-color": "var(--v4-common-sky-color)",
      "v4-common-green-color": "var(--v4-common-green-color)",
      "v4-common-blue-color": "var(--v4-common-blue-color)",
      "v4-common-violet-color": "var(--v4-common-violet-color)",
      "v4-common-red-color": "var(--v4-common-red-color)",
      "v4-common-yellow-color": "var(--v4-common-yellow-color)",
      "v4-favorite-star-color": "var(--v4-favorite-star-color)",
      "v4-main-text-color": "var(--v4-main-text-color)",
      "v4-secondary-text-color": "var(--v4-secondary-text-color)",
      "v4-tertiary-text-color": "var(--v4-tertiary-text-color)",
      "v4-subtle-text-color": "var(--v4-subtle-text-color)",
      "v4-placeholder-text-color": "var(--v4-placeholder-text-color)",
      "v4-main-background-color": "var(--v4-main-background-color)",
      "v4-secondary-background-color": "var(--v4-secondary-background-color)",
      "v4-tertiary-background-color": "var(--v4-tertiary-background-color)",
      "v4-list-hover-color": "var(--v4-list-hover-color)",
      "v4-popup-background-color": "var(--v4-popup-background-color)",
      "v4-popup-header-footer-color": "var(--v4-popup-header-footer-color)",
      "v4-input-border-color": "var(--v4-input-border-color)",
      "v4-input-background-color": "var(--v4-input-background-color)",
      "v4-border-color": "var(--v4-border-color)",
      "v4-border-subtle-color": "var(--v4-border-subtle-color)",
      "v4-badge-success-bg-color": "var(--v4-badge-success-bg-color)",
      "v4-badge-success-text-color": "var(--v4-badge-success-text-color)",
      "v4-badge-info-bg-color": "var(--v4-badge-info-bg-color)",
      "v4-badge-info-text-color": "var(--v4-badge-info-text-color)",
      "v4-badge-error-bg-color": "var(--v4-badge-error-bg-color)",
      "v4-badge-error-text-color": "var(--v4-badge-error-text-color)",
      "v4-badge-warning-bg-color": "var(--v4-badge-warning-bg-color)",
      "v4-badge-warning-text-color": "var(--v4-badge-warning-text-color)",
      "v4-badge-neutral-bg-color": "var(--v4-badge-neutral-bg-color)",
      "v4-badge-neutral-text-color": "var(--v4-badge-neutral-text-color)",
      "v4-badge-accent-bg-color": "var(--v4-badge-accent-bg-color)",
      "v4-badge-accent-text-color": "var(--v4-badge-accent-text-color)",
      "v4-badge-approver-bg-color": "var(--v4-badge-approver-bg-color)",
      "v4-badge-approver-text-color": "var(--v4-badge-approver-text-color)",
      "v4-badge-sky-bg-color": "var(--v4-badge-sky-bg-color)",
      "v4-badge-sky-text-color": "var(--v4-badge-sky-text-color)",
      "v4-badge-brand-navy-color": "var(--v4-badge-brand-navy-color)",

      /* V4 Status Surface Colors */
      "v4-surface-success": "var(--v4-surface-success)",
      "v4-surface-success-bold": "var(--v4-surface-success-bold)",
      "v4-border-success": "var(--v4-border-success)",
      "v4-border-success-subtle": "var(--v4-border-success-subtle)",
      "v4-text-success": "var(--v4-text-success)",
      "v4-surface-warning": "var(--v4-surface-warning)",
      "v4-surface-warning-bold": "var(--v4-surface-warning-bold)",
      "v4-border-warning": "var(--v4-border-warning)",
      "v4-border-warning-subtle": "var(--v4-border-warning-subtle)",
      "v4-text-warning": "var(--v4-text-warning)",

      /* V4 Insight Card Colors */
      "v4-insight-card-background-red": "var(--v4-insight-card-background-red)",
      "v4-insight-card-background-orange":
        "var(--v4-insight-card-background-orange)",
      "v4-insight-card-background-blue":
        "var(--v4-insight-card-background-blue)",
      "v4-mailing-card-selected-bg-blue":
        "var(--v4-mailing-card-selected-bg-blue)",
      "v4-mailing-card-selected-bg-orange":
        "var(--v4-mailing-card-selected-bg-orange)",
      "v4-insight-card-background-purple":
        "var(--v4-insight-card-background-purple)",
      "v4-insight-card-background-green":
        "var(--v4-insight-card-background-green)",
      "v4-insight-card-border-red": "var(--v4-insight-card-border-red)",
      "v4-insight-card-border-orange": "var(--v4-insight-card-border-orange)",
      "v4-insight-card-border-blue": "var(--v4-insight-card-border-blue)",
      "v4-insight-card-border-purple": "var(--v4-insight-card-border-purple)",
      "v4-insight-card-border-green": "var(--v4-insight-card-border-green)",
      "v4-insight-card-icon-red": "var(--v4-insight-card-icon-red)",
      "v4-insight-card-icon-orange": "var(--v4-insight-card-icon-orange)",
      "v4-insight-card-icon-blue": "var(--v4-insight-card-icon-blue)",
      "v4-insight-card-icon-purple": "var(--v4-insight-card-icon-purple)",
      "v4-insight-card-icon-green": "var(--v4-insight-card-icon-green)",
      "v4-insight-card-label-text-red": "var(--v4-insight-card-label-text-red)",
      "v4-insight-card-label-text-orange":
        "var(--v4-insight-card-label-text-orange)",
      "v4-insight-card-label-text-blue":
        "var(--v4-insight-card-label-text-blue)",
      "v4-insight-card-label-text-purple":
        "var(--v4-insight-card-label-text-purple)",
      "v4-insight-card-label-text-green":
        "var(--v4-insight-card-label-text-green)",
      "v4-insight-card-main-number-red":
        "var(--v4-insight-card-main-number-red)",
      "v4-insight-card-main-number-orange":
        "var(--v4-insight-card-main-number-orange)",
      "v4-insight-card-main-number-blue":
        "var(--v4-insight-card-main-number-blue)",
      "v4-insight-card-main-number-purple":
        "var(--v4-insight-card-main-number-purple)",
      "v4-insight-card-main-number-green":
        "var(--v4-insight-card-main-number-green)",
      "v4-insight-card-sub-number-red": "var(--v4-insight-card-sub-number-red)",
      "v4-insight-card-sub-number-orange":
        "var(--v4-insight-card-sub-number-orange)",
      "v4-insight-card-sub-number-blue":
        "var(--v4-insight-card-sub-number-blue)",
      "v4-insight-card-sub-number-purple":
        "var(--v4-insight-card-sub-number-purple)",
      "v4-insight-card-sub-number-green":
        "var(--v4-insight-card-sub-number-green)"
    },
    extend: {
      fontFamily: {
        inter: ["var(--inter)"],
        roboto: ["var(--roboto)"],
        signatureFont: ["var(--signature-font)"],
        funnel: ["var(--font-funnel)"],
        peridot: ["var(--font-peridot)"]
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)"
      },
      keyframes: {
        "v4-fade-in": {
          from: { opacity: "0", transform: "scale(0.8)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" }
        }
      },
      animation: {
        "v4-fade-in": "v4-fade-in 0.2s ease",
        "slide-in-right": "slide-in-right 0.2s ease-out",
        shimmer: "shimmer 1.5s ease-in-out infinite"
      },
      boxShadow: {
        "common-button": "0px 4px 4px 0px rgba(0, 74, 124, 0.25)",
        "common-selector": "0px 6px 10px 0px rgba(0, 74, 124, 0.18)",
        "common-tab-switch": "0px 1px 2px 0px rgba(0, 58, 98, 0.25)",
        "common-tab-bottom": "0px 5px 4px -4px rgba(0, 74, 124, 0.15)",
        "common-box-shadow": "var(--common-box-shadow)",
        "v4-popup": "0 20px 60px 0 rgba(17, 24, 39, 0.18)",
        "v4-card-hover": "0 4px 12px 0 rgba(17, 24, 39, 0.10)",
        "v4-card": "0 1px 3px 0 rgba(17, 24, 39, 0.06)"
      },
      screens: {
        laptop: "1100px",
        midrange: { min: "768px", max: "1419.98px" }
      },
      gridTemplateColumns: {
        16: "repeat(16, minmax(0, 1fr))"
      }
    }
  },
  plugins: []
};
