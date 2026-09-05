import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useTheme } from '@mui/material/styles';
import { formatLargeCurrency, useLocalization } from "@ui/ui-lib";
import { StyledbottomLine } from './styles';

type EChartsOption = echarts.EChartsOption;

interface ScatterChartData {
    value: [number, number];
    name?: string;
}

interface ScatterChartSeries {
    name: string;
    data: ScatterChartData[];
    color: string;
}

interface ScatterChartProps {
    series: ScatterChartSeries[];
    width?: number;
    height?: number;
    title?: string;
    subTitle?: string;
}

function ScatterChart({
    series,
    width = 600,
    height = 400,
    title = 'Scatter Chart',
    subTitle = ''
}: ScatterChartProps) {
    const theme = useTheme();
    const { localizationData } = useLocalization();
    const localization = localizationData?.data;
    const option: EChartsOption = {
        title: {
            text: title,
            subtext: subTitle,
            left: 'center',
            top: '2%'
        },
        tooltip: {
            trigger: 'item'
        },
        legend: {
            data: series.map(s => s.name),
            orient: 'horizontal',
            left: 'center',
            bottom: '5%',
            padding: [15, 20, 10, 20],
            itemGap: 20
        },
        grid: {
            left: '10%',
            right: '10%',
            top: '2%',
            bottom: '25%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: 'Client Service Score',
            nameLocation: 'middle',
            nameGap: 30,
            min: 0,
            max: 100,
            interval: 25,
            axisLabel: {
                formatter: '{value}'
            },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed',
                    color: theme.palette.text.lightGrey
                }
            }
        },
        yAxis: {
            type: 'value',
            name: 'Brokerage',
            nameLocation: 'middle',
            nameGap: 50,
            min: 0,
            max: 45,
            interval: 15,
            axisLabel: {
                formatter: (value: number) => {
                    const brokerageInLakhs = value === 45 ? 57 : value;
                    const brokerageAmount = brokerageInLakhs * 1e5;
                    return formatLargeCurrency(brokerageAmount, localization).trim();
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed',
                    color: theme.palette.text.lightGrey
                }
            }
        },
        series: series.map(seriesItem => ({
            name: seriesItem.name,
            data: seriesItem.data,
            type: 'scatter',
            symbolSize: 8,
            itemStyle: {
                color: seriesItem.color
            }
        }))
    };

    return (
        <div style={{ position: 'relative', width: `${width}px`, height: `${height}px` }}>
            <ReactECharts
                option={option}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'canvas' }}
            />
            <StyledbottomLine/>
        </div>
    );
}

export default ScatterChart;