import React from 'react';
import ScatterChart from '../Charts/ScatterChart';
import { StyledClientServiceContainer } from './styles';
// Sample data for demonstration
const sampleData = [
  {
    name: 'Low (0-70)',
    color: '#ff4444', // Red
    data: [
      { value: [35, 5] },
      { value: [45, 8] },
      { value: [25, 3] },
      { value: [60, 12] },
      { value: [55, 10] },
      { value: [40, 7] },
    ]
  },
  {
    name: 'Medium (70-85)',
    color: '#ffcc00', // Yellow
    data: [
      { value: [75, 18] },
      { value: [80, 22] },
      { value: [72, 15] },
      { value: [78, 20] },
      { value: [82, 25] },
      { value: [76, 17] },
    ]
  },
  {
    name: 'High (85-100)',
    color: '#44ff44', // Green
    data: [
      { value: [90, 28] },
      { value: [95, 30] },
      { value: [88, 26] },
      { value: [92, 29] },
      { value: [87, 24] },
      { value: [96, 29] },
    ]
  }
];

function ClientServiceAnalysis() {
  return (
    <StyledClientServiceContainer>
      <ScatterChart
        series={sampleData}
        width={700}
        height={500}
        title=""
        subTitle=""
      />
    </StyledClientServiceContainer>
  );
}

export default ClientServiceAnalysis;