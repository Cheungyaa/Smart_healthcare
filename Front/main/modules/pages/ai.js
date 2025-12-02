import { INFO_URL } from '../../config.js';
import { get30daysData } from '../dataManager.js';

const userId = localStorage.getItem('username');

async function getGPTResponse(){
    const userData = await get30daysData();
    const prompt = "위에 있는 데이터를 사용하여, 사용자의 건강 상태를 분석하고, 건강한 생활을 위한 조언을 해주세요.";
    const gptInput = userData + "\n\n" + prompt;
    console.log(gptInput);
        

    const APIKEY = ""
    // try {
    //     const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Authorization': `Bearer ${APIKEY}`
    //         },
    //         body: JSON.stringify(gptInput)
    //     });

    //     const resultJSON = await response.json();
        
    //     // GPT가 실제로 반환한 값 추출
    //     const resultContent = resultJSON.choices[0].message.content

    //     return resultContent;
        
    // } catch (error) {
    //     console.error('Error: ', error);
    //     return "";
    // }
}

