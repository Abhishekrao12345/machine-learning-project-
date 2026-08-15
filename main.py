import joblib
from fastapi import FastAPI
from pydantic import BaseModel, Field
import pandas as pd
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware

model = joblib.load("mental_health_model.pkl")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class studentdata(BaseModel):

    Age                    : int = Field(...,ge=10, le=100) 
    Gender                 : Literal["MALE","FEMALE"] 
    Country                : str
    Academic_Level         : Literal["Undergraduate","Graduate","High School"]
    Most_Used_Platform     : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat','Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat']
    Purpose_Of_Use         : Literal['Networking', 'Education', 'Entertainment', 'News']
    Avg_Daily_Usage_Hours  : int = Field(..., ge=0,le=24)
    Daily_Unlocks          : int = Field(..., ge=0)
    Study_Hours            : int = Field(...,ge=0,le=24)
    Physical_Activity_Hours: int = Field(...,ge=0,le=24)
    Sleep_Hours_Per_Night  : int = Field(...,ge=0,le=24)
    Stress_Level           : Literal['Medium', 'Low', 'Very High', 'High']

class predictionresponse(BaseModel):
    predicted_mental_health_score : float


top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

@app.get("/")
def weclome():
  return "Menatal Health Project"


@app.post('/predict',response_model = predictionresponse)
def predict(data:studentdata):

    Grouped_country = data.Country if data.Country in top_countries else "other"

    get_row= pd.DataFrame([{
        'Age'                       : data.Age,
        'Gender'                    : data.Gender,
        'Country'                   : data.Country,
        'Academic_Level'            : data.Academic_Level,
        'Most_Used_Platform'        : data.Most_Used_Platform,
        'Purpose_Of_Use'            : data.Purpose_Of_Use, 
        'Avg_Daily_Usage_Hours'     : data.Avg_Daily_Usage_Hours,
        'Daily_Unlocks'             : data.Daily_Unlocks,
        'Study_Hours'               : data.Study_Hours,
        'Physical_Activity_Hours'   : data.Physical_Activity_Hours,     
        'Sleep_Hours_Per_Night'     : data.Sleep_Hours_Per_Night,
        'Stress_Level'              : data.Stress_Level,
        'Grouped_country'           : Grouped_country
    }])


    final_prediction = model.predict(get_row)[0]
    return predictionresponse(predicted_mental_health_score=round(float(final_prediction),2))




