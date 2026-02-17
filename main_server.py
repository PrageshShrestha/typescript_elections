from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import sqlite3
import csv
import os
import re
from typing import List, Dict, Any
import traceback
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Database setup
database = "election.db"
table_name = "table_infos"  # Note: plural table name
table_fields = ['voter_id','name','age_gender','parent_name','spouse','picture','municipality','ward','booth','age','gender','pratinidhi','pradesh','sn']

# Static data
municipality = ['चोंरीदेउराली गाउँपालिका','तेमाल गाउँपालिका','नमोबुद्ध नगरपालिका','महाभारत गाउँपालिका','रोशी गाउँपालिका','खानीखोला गाउँपालिका','धुलिखेल नगरपालिका','नगरपालिका नमोबुद्ध','पनोती नगरपालिका','बेथानचोक गाउँपालिका']
wards = ['१','२','३','४','५','६','७','८','९','१०','११','१२']
gender = ['पुरुष', 'महिला']

# Real dataset with hierarchical structure: {municipality: {ward: [booths]}}
real_dataset = {
    'चोंरीदेउराली गाउँपालिका': {
        '१': ['सुर्योदय मा.वि॰ को नयाँ भवन| गोतामचोर'],
        '२': ['खाँडादेवी माःवि॰ पलाकथली किल्पु'],
        '३': ['बुद्ध हिमालय मा.वि. माझीफेदा ० १'],
        '४': ['ग्रम विकास मा.वि॰ वसेरी शिवालय', 'सरस्वती उ.मा.वि॰ को नयाँ भवन| ० सालिमे'],
        '५': ['मा.वि. केउरेनी जागृती', 'अरनिको मा.वि. हर्रेडाडा'],
        '६': ['प्रभा मा.वि.॰ देउराली'],
        '७': ['७ न. वडा कार्यालय'],
        '८': ['भुमेस्थान मा.वि॰ विर्तदेउराली'],
        '९': ['इश्वरीदेवी आ.वि॰ मानेडाडा']
    },
    'तेमाल गाउँपालिका': {
        '१': ['जनचेतना मा.वि. ० सर्स्युखर्क'],
        '२': ['सर्वाद्धार मा.वि. चुखा मयलचार'],
        '३': ['भुमे मा.बि. सरमथली'],
        '४': ['कालिका आ.वि. भवन| ० माहुर', 'तेमाल मा.वि'],
        '५': ['नारायणस्थान आ.वि॰ गिम्दी', 'नारायणस्थान मा.वि. १ पाटीचोर नारायणस्थान'],
        '६': ['पंचकन्या मा.वि॰ ठुलोपर्सेल'],
        '७': ['भुमेश्वर आ.वि॰ कुरुवास', 'राधाकृष्ण मा.वि. १ चापाखोरी'],
        '८': ['सेतीदेवी मा.वि. ) लुम्साल'],
        '९': ['९ न वडा कार्यालय']
    },
    'नमोबुद्ध नगरपालिका': {
        '३': ['३ न वडा कार्यालय'],
        '४': ['जनक मा.वि. काफ्लेथोक'],
        '५': ['सातमुल मा.वि.॰ वोहोरे', 'कानपुर मा.वि.| कानपुर']
    },
    'महाभारत गाउँपालिका': {
        '१': ['गोकुले मा.वि. भवन'],
        '२': ['शोक्तेल भुमि प्रा.बि॰ शोक्तेल भञ्याङ'],
        '३': ['सिद्धेश्वर मा.बि.| सानो पोखरा'],
        '४': ['ठाकुरस्थान आ.वि॰ गोठडांडा'],
        '५': ['श्री ग्रामोन्नती मा बि किल्ला'],
        '६': ['श्री आजद आ. बि.'],
        '७': ['ज्योती मा.वि॰ आहाले वासपुर'],
        '८': ['जनकल्याण मा.वि.| कोलवोट घर्तिछाप']
    },
    'रोशी गाउँपालिका': {
        '१': ['चेतना मा.वि॰ ताङलीङ'],
        '२': ['ग्रामोत्थान प्राःबि॰ चण्डीचोर', 'जोगेश्वर मा.वि. महादेवटार पाँगु', 'भमिस्थान मा. बि.'],
        '३': ['देवि मा.वि ० शिखर'],
        '६': ['कालिदेबी आ. बि॰ पिन्डाडा', 'हिमालय मा.वि.|चिलाउने'],
        '७': ['रोशी मा.वि॰ भवन| कटुन्जेवेशी'],
        '८': ['इन्द्रोदय आ.वि.| घिसिङटोल पोखरी'],
        '९': ['मंगल जनविजय मा.वि॰ मंगलटार', 'महाकालीदेवी कर्मोदय आधारभूत विद्यालय| पिन'],
        '१०': ['पंचकन्या मा.वि॰ वाल्टिङ कुण्डचोर'],
        '११': ['पोक्रा मा.वि. भदोरे'],
        '१२': ['गणेश मा.वि॰ शिखरपुर']
    },
    'खानीखोला गाउँपालिका': {
        '१': ['देविस्थान आ.वि. दयागाउ', 'धार्ने ज्योती मा बि'],
        '२': ['बाल बिकास मा बि', 'कुमारी मा.वि. जगथली', 'जन विकास मा.वि॰ तालढ़ूंगा'],
        '३': ['मा.वि. भृकुटी'],
        '७': ['बुद्ध मा.बि. धाप्ले', 'जनहित माःवि. १ ) महाङ्काल'],
        '८': ['शारदा मा.वि॰ देउराली', 'जनप्रिय प्राःबि. माझीटार']
    },
    'धुलिखेल नगरपालिका': {
        '८': ['चक्रदेबी प्राःबि. पकुचा', 'सरस्वती मा.वि. वडाल गाउँ'],
        '९': ['करथरी मा.वि. भञ्याङ', 'बछलादेवी माध्यामिक विद्यालय|'],
        '१०': ['कालिका मा.बि. शारदावतासे'],
        '११': ['हनमान मा.वि. भवन| हनुमानखर्क', 'कालीदेवी मा.वि॰ डांडागाँउ'],
        '१२': ['शंखेश्वरी महालक्ष्मी मा.बि. पाटीचोर', 'इटे सामुदायिक भवन']
    },
    'नगरपालिका नमोबुद्ध': {
        '१': ['लक्ष्मी नारायण मा.वि॰ आचार्य गाँउ सिमलचोर', 'मथुरापाटी मा.वि॰ फुलवारी'],
        '२': ['२ नं वडा कार्यालय'],
        '६': ['६ न को वडा कार्यालय', 'सेती देवी माध्यामिक विद्यालय पिपलटार', 'दाप्चा मा.बि. डराउने पोखरी'],
        '७': ['जनहित माःवि. १ ) खनालथोक'],
        '८': ['६ न को वडा कार्यालय', 'सेती देवी माध्यामिक विद्यालय पिपलटार', 'दाप्चा मा.बि. डराउने पोखरी'],
        '९': ['श्रीकृष्ण मा.वि. दाप्चा छत्रेवाझ', 'नेपाने बुद्घपार्क'],
        '१०': ['बाल उज्वल मा.वि. ० ० पुरानोगाउँ', 'पंचकन्या आ.॰ बि.'],
        '११': ['आधारभूत विद्यालय| कुरुगाउँ नमोबुद्ध']
    },
    'पनोती नगरपालिका': {
        '२': ['बालोद्धार मा.वि. ० ० यपाटार', 'अम्बिका वालविकास आ.वि. ० ) संखेल', 'श्वेत गणेश आधारभूत विद्यालय', 'वडा कार्यालय पनोती न.पा. ० ९ सूब्बागाउ'],
        '७': ['इन्द्रेश्वर मा.बि. ० ९ सिरानचोर', 'काठ गणेश सत्तल| पनोती', 'साविक पनोती गाबिस भवन लायाकु'],
        '८': ['गोरखनाथ आ. बि. दलिनचोक', 'सिद्घार्थ वनस्थली मा.वि. मल्पी', 'भालेश्वर मा.वि. भवन| मल्पी'],
        '९': ['शारदा मा.वि. ० सुन्थान'],
        '१०': ['श्रीराम मा.वि॰ भवन| खोपासी', 'बालआदर्श आधारभूत विद्यालय| पस्थली']
    },
    'बेथानचोक गाउँपालिका': {
        '८': ['सरस्वती मा.बि. महाकाल चोर भुगदेउ', 'बाल उनन्ती प्रा.बि. सिउरानी']
    }
}

# Helper functions
def extract_age(age_gender: str) -> int:
    match = re.search(r'(\d+)', age_gender)
    return int(match.group(1)) if match else 0

def extract_gender(age_gender: str) -> str:
    if 'पुरुष' in age_gender:
        return 'Male'
    elif 'महिला' in age_gender:
        return 'Female'
    else:
        return 'Male'  # Default to Male

def normalize_ward(ward: str) -> str:
    match = re.search(r'(\d+)', ward)
    return f"Ward {match.group(1)}" if match else ward

# Devanagari conversion utilities
def devanagari_to_regular(text: str) -> str:
    """Convert Devanagari text to regular text"""
    devanagari_to_regular = {'०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'}
    return ''.join([devanagari_to_regular.get(d, d) for d in text])

def regular_to_devanagari(text: str) -> str:
    """Convert regular text to Devanagari text"""
    regular_to_devanagari = {'0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'}
    return ''.join([regular_to_devanagari.get(d, d) for d in text])

def convert_devanagari_age(age_str: str) -> int:
    """Convert Devanagari age string to integer"""
    if not age_str:
        return 0
    regular_age = devanagari_to_regular(age_str)
    try:
        return int(regular_age)
    except ValueError:
        return extract_age(age_str)  # Fallback to extraction from age_gender

def convert_devanagari_gender(gender_str: str) -> str:
    """Convert Devanagari gender to English"""
    if not gender_str:
        return 'Male'  # Default fallback
    if 'पुरुष' in gender_str:
        return 'Male'
    elif 'महिला' in gender_str:
        return 'Female'
    else:
        return 'Male'  # Default to Male if no match found

@app.get("/homepage")
def read_root():
    return {
        "gender": gender,
        "real_dataset": real_dataset
    }

# API Endpoints for frontend
@app.get("/api/hierarchical-data")
async def get_hierarchical_data():
    """Get hierarchical data for dynamic dropdown filtering"""
    return {
        "municipalities": list(real_dataset.keys()),
        "real_dataset": real_dataset
    }
@app.get("/api/options")
async def get_options():
    """Get dropdown options for municipalities, wards, and booths - filtered by real_dataset"""
    try:
        # Only use municipalities that exist in real_dataset
        municipalities = list(real_dataset.keys())
        
        # Get all wards from real_dataset (flattened)
        all_wards = set()
        all_booths = set()
        
        for municipality_data in real_dataset.values():
            for ward, booths in municipality_data.items():
                all_wards.add(f"Ward {ward}")
                all_booths.update(booths)
        
        return {
            "municipalities": municipalities,
            "wards": sorted(list(all_wards)),
            "booths": sorted(list(all_booths)),
            "genderOptions": ['पुरुष', 'महिला']
        }
    except Exception as e:
        # Fallback to real_dataset values if something fails
        all_wards = set()
        all_booths = set()
        
        for municipality_data in real_dataset.values():
            for ward, booths in municipality_data.items():
                all_wards.add(f"Ward {ward}")
                all_booths.update(booths)
        
        return {
            "municipalities": list(real_dataset.keys()),
            "wards": sorted(list(all_wards)),
            "booths": sorted(list(all_booths)),
            "genderOptions": ['पुरुष', 'महिला']
        }

class QueryParams(BaseModel):
    search: Optional[str] = None
    gender: Optional[str] = None
    municipality: Optional[str] = None
    ward: Optional[str] = None
    booth: Optional[str] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    limit: Optional[int] = None

@app.options("/api/voters")
async def options_voters():
    """Handle OPTIONS preflight request"""
    from fastapi import Response
    return Response(
        content={"message": "CORS preflight successful"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400"
        }
    )

@app.post("/api/voters")
async def query_voters(request: Request, params: Optional[QueryParams] = None):
    """Query voters with filters"""
    # If no params provided, use defaults
    if params is None:
        params = QueryParams()
    
    # Log the received filter parameters
    print(f"\n🔍 === API REQUEST RECEIVED ===")
    print(f"📋 Filter Parameters:")
    print(f"  - Search: '{params.search}'")
    print(f"  - Gender: '{params.gender}'")
    print(f"  - Municipality: '{params.municipality}'")
    print(f"  - Ward: '{params.ward}'")
    print(f"  - Booth: '{params.booth}'")
    print(f"  - Min Age: {params.min_age}")
    print(f"  - Max Age: {params.max_age}")
    print(f"  - Limit: {params.limit}")
    print(f"================================\n")
    
    # Convert string 'None' to actual None for proper filtering
    if params.search == 'None':
        params.search = None
    if params.gender == 'None':
        params.gender = None
    if params.municipality == 'None':
        params.municipality = None
    if params.ward == 'None':
        params.ward = None
    if params.booth == 'None':
        params.booth = None
    
    try:
        conn = sqlite3.connect(database)
        cursor = conn.cursor()
        
        # Build query
        query = "SELECT * FROM table_infos WHERE 1=1"
        query_params = []
        
        # if params.search:
        #     query += " AND (name LIKE ? OR parent_name LIKE ? OR spouse LIKE ?)"
        #     query_params.extend([f"%{params.search}%", f"%{params.search}%", f"%{params.search}%"])
        
        if params.gender:
            
            if params.gender == 'Male':
                query += " AND gender = 'पुरुष'"
            elif params.gender == 'Female':
                query += " AND gender = 'महिला'"
            
        
        if params.municipality:
            query += f" AND municipality == '{params.municipality}'"
            
        
        if params.ward:
            # Extract ward number for comparison
            ward_match = re.search(r'(\d+)', params.ward)
            if ward_match:
                ward_num = ward_match.group(1)
                query += f" AND ward LIKE '%{regular_to_devanagari(ward_num)}%'"
        
        if params.booth:
            query += f" AND booth = '{params.booth}'"
        
       
        
        # Filter by real_dataset hierarchy - only include voters that exist in real_dataset
        if params.municipality:
            # If municipality is specified, only include that municipality from real_dataset
            if params.municipality not in real_dataset:
                return {"voters": [], "totalCount": 0}
        
            
        
        # Get total count
        count_query = query.replace("SELECT *", "SELECT COUNT(*)")
        cursor.execute(count_query)
        total_count = cursor.fetchone()[0]
        print(query)
        # Execute query without limit to get all voters
        cursor.execute(query, query_params)
        rows = cursor.fetchall()
        
        # Convert to frontend format
        voters = []
        
        for row in rows:
            voter_dict = dict(zip(table_fields, row))
            
            voters.append({
                "voter_id": voter_dict.get('voter_id', ''),
                "name": voter_dict.get('name', ''),
                "age_gender": voter_dict.get('age_gender', ''),
                "age": convert_devanagari_age(voter_dict.get('age', '')),
                "gender": convert_devanagari_gender(voter_dict.get('gender', '')),
                "parent_name": voter_dict.get('parent_name', ''),
                "spouse": voter_dict.get('spouse', ''),
                "picture": voter_dict.get('picture', ''),
                "municipality": voter_dict.get('municipality', ''),
                "ward": normalize_ward(voter_dict.get('ward', '')),
                "booth": voter_dict.get('booth', ''),
                "pratinidhi": voter_dict.get('pratinidhi', ''),
                "pradesh": voter_dict.get('pradesh', ''),
                "sn": voter_dict.get('sn', '')
            })
        
        conn.close()
        
        # Log the response data
        print(f"📊 === API RESPONSE ===")
        print(f"📈 Results Summary:")
        print(f"  - Voters Returned: {len(voters)}")
        print(f"  - Total Count: {total_count}")
        print(f"  - Sample Voters (first 3):")
        for i, voter in enumerate(voters[:3]):
            print(f"    {i+1}. {voter.get('name', 'N/A')} ({voter.get('municipality', 'N/A')} - {voter.get('ward', 'N/A')})")
        if len(voters) > 3:
            print(f"    ... and {len(voters) - 3} more")
        print(f"========================\n")
        
        return {
            "voters": voters,
            "totalCount": total_count
        }
    except Exception as e:
        traceback.print_exc()
        return {
            "voters": [],
            "totalCount": 0,
            "error": str(e)
        }

@app.get("/api/stats/gender")
async def get_gender_stats(
    search: Optional[str] = None,
    municipality: Optional[str] = None,
    ward: Optional[str] = None,
    booth: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None
):
    """Get gender statistics"""
    try:
        params = QueryParams(
            search=search,
            municipality=municipality,
            ward=ward,
            booth=booth,
            min_age=min_age,
            max_age=max_age
            # No limit - get all voters for accurate statistics
        )
        result = await query_voters(params)
        
        stats = {}
        for voter in result.get('voters', []):
            gender = voter.get('gender', 'Male')  # Default to Male instead of Other
            stats[gender] = stats.get(gender, 0) + 1
        
        total = sum(stats.values())
        gender_map = {'Male': 'पुरुष', 'Female': 'महिला'}  # Remove Other mapping
        
        return [
            {
                "label": gender_map.get(gender, gender),
                "count": count,
                "percentage": round((count / total) * 100) if total > 0 else 0
            }
            for gender, count in stats.items()
        ]
    except Exception as e:
        return []

@app.get("/api/stats/age")
async def get_age_stats(
    search: Optional[str] = None,
    municipality: Optional[str] = None,
    ward: Optional[str] = None,
    booth: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None
):
    """Get age group statistics"""
    try:
        params = QueryParams(
            search=search,
            municipality=municipality,
            ward=ward,
            booth=booth,
            min_age=min_age,
            max_age=max_age
            # No limit - get all voters for accurate statistics
        )
        result = await query_voters(params)
        
        stats = {}
        for voter in result.get('voters', []):
            age = voter.get('age', 0)
            if 18 <= age <= 25:
                group = '१८-२५ वर्ष'
            elif 26 <= age <= 35:
                group = '२६-३५ वर्ष'
            elif 36 <= age <= 45:
                group = '३६-४५ वर्ष'
            elif 46 <= age <= 55:
                group = '४६-५५ वर्ष'
            elif 56 <= age <= 65:
                group = '५६-६५ वर्ष'
            elif age > 65:
                group = '६५+ वर्ष'
            else:
                continue
            
            stats[group] = stats.get(group, 0) + 1
        
        total = sum(stats.values())
        
        return [
            {
                "label": group,
                "count": count,
                "percentage": round((count / total) * 100) if total > 0 else 0
            }
            for group, count in stats.items()
        ]
    except Exception as e:
        return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
