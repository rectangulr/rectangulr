## List

*List* is a component for displaying and interacting with lists, supporting keyboard navigation, item highlighting, and
customizable rendering.

- **Keyboard Navigation:** Use arrow keys, Page Up/Down to move selection.
- **Current Item Highlighting:** Visually highlights the selected item.
- **Custom Rendering:** Supports custom templates or components for list items.
- **Virtualization:** Only a window of items is rendered for performance.
- **Selection Output:** Emits events when selection changes.
- **Integration:** Works with Angular forms via `NG_VALUE_ACCESSOR`.

**Inputs:**

- `items: T[]` (required): The array of items to display. Accepts arrays, signals, or observables.
- `trackByFn`: Function to optimize rendering (default: by item reference).
- `displayComponent`: Optional component to render each item.
- `template`: Optional template for item rendering.
- `onItemsChangeSelect`: Which item to select when the list updates (`'first' | 'last' | 'same'`).
- `onInitSelect`: Which item to select on initialization (`'first' | 'last'`).
- `styleItem`: Whether to style the selected item (default: `true`).
- `S`: Style object for customizing the selected item appearance.

**Outputs:**

- `selectedItem: T | null`: Emits the currently selected item.
- `selectedIndex: number | undefined`: Emits the index of the selected item.
- `visibleItems: T[]`: Emits the currently visible items.

**Keyboard Shortcuts:**
- **↓ / ↑:** Move selection.
- **Page Down / Up:** Jump up/down a page.

**Customization:**
Provide a custom template or component for item rendering. Adjust `windowSize` for virtualization. Use the `S` input to style the selected item.


<preview src="src/pages/docs/list.ts" />
