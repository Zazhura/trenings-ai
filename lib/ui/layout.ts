/**
 * Design system utilities for consistent layout and spacing
 * Uses Tailwind utility classes - no new dependencies
 */

/**
 * Container width utilities
 * - max-w-7xl: 1280px max width
 * - Responsive padding: px-4 sm:px-6 lg:px-8
 */
export const containerClasses = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'

/**
 * Page header pattern
 * - Consistent typography and spacing
 */
export const pageHeaderClasses = 'mb-8 sm:mb-10'

/**
 * Page title pattern
 * - Large, bold heading
 */
export const pageTitleClasses = 'text-3xl sm:text-4xl font-bold tracking-tight'

/**
 * Page description pattern
 * - Muted text, readable line height
 */
export const pageDescriptionClasses = 'mt-2 text-base sm:text-lg text-muted-foreground'

/**
 * Standard spacing tokens (using Tailwind spacing scale)
 * - 2 = 8px
 * - 4 = 16px
 * - 6 = 24px
 * - 8 = 32px
 */
export const spacing = {
  xs: 'space-y-2',    // 8px
  sm: 'space-y-4',    // 16px
  md: 'space-y-6',    // 24px
  lg: 'space-y-8',    // 32px
} as const

/**
 * Form spacing pattern
 * - Consistent spacing between form elements
 */
export const formSpacingClasses = 'space-y-6'

/**
 * Card container pattern
 * - Responsive max width for forms
 */
export const cardContainerClasses = 'w-full max-w-[420px] mx-auto'

