const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// 设置串口（修改为你的实际端口号，如 COM5）
const arduinoPort = new SerialPort({ path: 'COM5', baudRate: 9600 }); // 替换 COM5 为你的实际端口号
const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

let temperatureData = []; // 用于存储最新的 30 个温度数据和时间
let isMonitoring = false; // 当前是否在监测
let insertDivider = false; // 标志是否需要插入分割线

// 监听来自 Arduino 的数据
parser.on('data', (data) => {
    data = data.trim(); // 去除数据两端的空白
    console.log("Received:", data); // 打印接收到的数据

    if (data === "Monitoring started...") {
        isMonitoring = true;
        insertDivider = true; // 标记插入分割线
    } else if (data === "Monitoring stopped...") {
        isMonitoring = false;
    } else if (isMonitoring) {
        const temperature = parseFloat(data); // 将数据转换为浮点数
        if (!isNaN(temperature)) { // 确保数据有效
            const timestamp = new Date().toLocaleString(); // 获取当前时间

            if (insertDivider) {
                // 插入分割线标志
                temperatureData.push({ temperature: '---', timestamp: 'Divider' });
                insertDivider = false; // 重置标志
            }

            temperatureData.push({ temperature, timestamp });
            if (temperatureData.length > 30) {
                temperatureData.shift(); // 保持数组长度为 30
            }
        } else {
            console.log("Invalid temperature data:", data);
        }
    }
});

// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 提供温度数据作为 JSON 格式
app.get('/temperature', (req, res) => {
    res.json({ temperatures: temperatureData });
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
