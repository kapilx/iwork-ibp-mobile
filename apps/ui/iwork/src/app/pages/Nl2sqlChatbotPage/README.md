# NL2SQL Chatbot - Data Visualization Components

This page implements a comprehensive NL2SQL chatbot with standardized data visualization components supporting text, bar charts, pie charts, tables, and error messages.

## 🚀 Features

### Data Representation Types

- **Text** - Plain text responses and summaries
- **Bar Chart** - Interactive ECharts bar charts for data visualization
- **Pie Chart** - Interactive ECharts pie charts for proportional data visualization
- **Table** - Advanced data tables with sorting, filtering, and pagination
- **Error** - Error message display with proper styling

## 📊 Components

### 1. Bar Chart (`BarChart/index.tsx`)

Interactive ECharts bar chart component with professional styling and animations.

```typescript
interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartConfig {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showValues?: boolean;
  showLabels?: boolean;
  height?: number;
  maxValue?: number;
  colorScheme?: string[];
}
```

Features:

- ✅ Interactive tooltips
- ✅ Professional styling
- ✅ Smooth animations
- ✅ Responsive design
- ✅ Custom color schemes

### 2. Pie Chart (`PieChart/index.tsx`)

Interactive ECharts pie chart component with professional styling and animations for proportional data visualization.

```typescript
interface EChartsPieChartData {
  label: string;
  value: number;
  color?: string;
}

interface EChartsPieChartConfig {
  title?: string;
  showValues?: boolean;
  showLabels?: boolean;
  height?: number;
  showLegend?: boolean;
  legendPosition?: "top" | "bottom" | "left" | "right";
  colorScheme?: string[];
  innerRadius?: number;
  outerRadius?: number;
  maxBarsToShow?: number;
  maxLabelLength?: number;
}
```

Features:

- ✅ Interactive tooltips
- ✅ Professional styling
- ✅ Smooth animations
- ✅ Responsive design
- ✅ Custom color schemes
- ✅ Smart legend positioning
- ✅ Text truncation for long labels
- ✅ Scrollable legends for many items

### 3. Data Table (`DataTable/index.tsx`)

Advanced data table component using the common Table from ui-lib with enterprise features.

```typescript
interface DataTableData {
  headers: string[];
  rows: (string | number)[][];
}

interface DataTableConfig {
  title?: string;
  height?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  enableSelection?: boolean;
  enableExport?: boolean;
}
```

Features:

- ✅ Advanced pagination
- ✅ Column sorting
- ✅ Data filtering
- ✅ Loading states
- ✅ Customizable styling
- ✅ Row interactions
- ✅ Export capabilities

### 4. Message Bubble (`MessageBubble/index.tsx`)

Unified message display component supporting all data representation types.

```typescript
interface MessageBubbleProps {
  id: string;
  type: "user" | "system";
  content: string;
  messageType?: "text" | "barChart" | "pieChart" | "table" | "error";
  barChartData?: BarChartData[];
  barChartConfig?: BarChartConfig;
  pieChartData?: PieChartData[];
  pieChartConfig?: PieChartConfig;
  tableData?: DataTableData;
  tableConfig?: DataTableConfig;
  timestamp?: string;
  error?: string;
  feedback?: "positive" | "negative" | null;
  onFeedback?: (messageId: string, feedback: "positive" | "negative") => void;
}
```

### 5. Chat Input (`ChatInput/index.tsx`)

Advanced chat input with rotating examples and validation.

```typescript
interface ChatInputProps {
  maxLength?: number;
  isSubmitting?: boolean;
  onSend(message: string): void;
  onCancel?(): void;
  examples?: string[];
}

interface ChatInputRef {
  setValue: (value: string) => void;
  focus: () => void;
  triggerSend: () => void;
}
```

Features:

- ✅ Rotating placeholder examples
- ✅ Character limit validation
- ✅ Keyboard shortcuts (Enter to send, Escape to blur)
- ✅ Clear input functionality
- ✅ Accessibility support
- ✅ Ref-based control for external triggers

### 6. Predefined Queries (`PredefinedQueries/index.tsx`)

Horizontal scrollable query suggestions with keyboard navigation.

```typescript
interface PredefinedQueriesProps {
  queries: string[];
  onQueryClick: (query: string) => void;
  title?: string;
}
```

Features:

- ✅ Horizontal scrolling with navigation buttons
- ✅ Click to populate input
- ✅ Keyboard navigation (Arrow keys, Home, End)
- ✅ Professional styling
- ✅ Responsive design
- ✅ Smooth scrolling to focused elements

### 7. Results Interface (`ResultsInterface/index.tsx`)

Main container for displaying chat messages with auto-scrolling.

```typescript
interface ResultsInterfaceProps {
  messages: Message[];
  isLoading?: boolean;
  onFeedback?: (messageId: string, feedback: "positive" | "negative") => void;
}
```

Features:

- ✅ Auto-scroll to new messages
- ✅ Loading state display
- ✅ Message feedback integration
- ✅ Smooth scrolling behavior

## 🎯 Usage Examples

### Trigger Different Data Types

1. **Text Response**: "What is the total revenue?"
2. **Bar Chart**: "Show quarterly revenue chart" or "Display sales performance graph"
3. **Pie Chart**: "Show demographic distribution" or "Display market share breakdown"
4. **Table**: "Show sales by region" or "Display comprehensive regional data"
5. **Error**: "Show error message"

## 🔧 Message Types

The chatbot supports exactly 5 message types as per requirements:

```typescript
type MessageType = "text" | "barChart" | "pieChart" | "table" | "error";
```

## 🎨 Styling Standards

All components follow strict styling standards:

- **No inline styles** - All styling uses Material-UI styled components
- **Professional colors** - Consistent color palette following user preferences
- **Responsive design** - Works on all screen sizes
- **Accessibility** - Proper ARIA labels and keyboard navigation
- **Clean code** - No console.log statements or unused code

## 📦 Dependencies

```json
{
  "echarts": "^5.6.0",
  "echarts-for-react": "^3.0.2",
  "@ui/ui-lib": "latest"
}
```

## 🚀 Getting Started

1. Import and use components:

```typescript
import EChartsBarChart from "./BarChart";
import EChartsPieChart from "./PieChart";
import DataTable from "./DataTable";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import PredefinedQueries from "./PredefinedQueries";
import ResultsInterface from "./ResultsInterface";
```

2. Use in your chatbot:

```typescript
// Bar chart
<EChartsBarChart
  data={chartData}
  config={{ title: "My Chart", height: 400 }}
/>

// Pie chart
<EChartsPieChart
  data={pieData}
  config={{ title: "Distribution", showLegend: true }}
/>

// Data table
<DataTable
  data={tableData}
  config={{ enableSorting: true, enableFiltering: true }}
/>

// Message bubble
<MessageBubble
  type="system"
  content="Here are the results:"
  messageType="pieChart"
  pieChartData={pieData}
  pieChartConfig={pieConfig}
/>

// Complete chatbot setup
<ResultsInterface
  messages={messages}
  isLoading={isLoading}
  onFeedback={handleFeedback}
/>
<ChatInput
  ref={chatInputRef}
  onSend={handleSend}
  examples={predefinedQueries}
  isSubmitting={isLoading}
/>
<PredefinedQueries
  queries={predefinedQueries}
  onQueryClick={handleQueryClick}
/>
```

## 🔄 Integration

The components are fully integrated with the existing chatbot architecture:

- **MessageBubble** handles all 5 visualization types (text, barChart, pieChart, table, error)
- **ResultsInterface** manages message display and auto-scrolling
- **ChatInput** provides input with rotating examples and validation
- **PredefinedQueries** offers clickable query suggestions
- **Main page** orchestrates all components with NL2SQL API integration
- All components follow the same styling patterns and use external styled components

## 🎯 Benefits

1. **Standardized** - Exactly 5 data representation types (text, barChart, pieChart, table, error)
2. **Professional** - Enterprise-grade visualizations with ECharts
3. **Interactive** - Rich user interactions, animations, and feedback system
4. **Responsive** - Works on all devices with adaptive layouts
5. **Maintainable** - Clean, typed, and well-documented code
6. **Accessible** - Proper ARIA labels, keyboard navigation, and screen reader support
7. **Consistent** - Follows established design system patterns
8. **Extensible** - Easy to add new visualization types or modify existing ones

## 🧹 Code Quality

- ✅ No inline styles
- ✅ No redundant code
- ✅ No unused code or console logs
- ✅ Follows all coding standards
- ✅ Proper TypeScript typing
- ✅ Clean component structure
- ✅ Consistent naming conventions
