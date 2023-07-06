import React from 'react';
import {render} from 'react-dom';
import {isDocx, isPdf} from './utils';

const App = () => {
    // 获取文件后缀
    const getFileSuffix = (file: File) => {
        const fileReader = new FileReader();
        fileReader.onload = async () => {
            const buffer = new Uint8Array(fileReader.result as ArrayBuffer);
            console.log(buffer)
            console.log(await isDocx(buffer));
        }
        fileReader.readAsArrayBuffer(file);
    }
    return (
        <div>
            <input
                type='file'
                onChange={(e) => {
                    const file = e.target.files?.[0] as File
                    getFileSuffix(file)
                }}
            />
        </div>
    )
}

render(<App />, document.getElementById('app'))