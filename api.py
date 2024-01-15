from datetime import datetime
from meteostat import Stations, Daily
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import sys

if len(sys.argv) < 4:
    print("Usage: python script.py latitude longitude uniqueId")
    sys.exit(1)
mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb+srv://aman27072005:aman27072005@cluster0.xzgimqn.mongodb.net/?retryWrites=true&w=majority')

latitude = float(sys.argv[1])
longitude = float(sys.argv[2])
uniqueId = sys.argv[3]

stations = Stations()
stations = stations.nearby(latitude, longitude)
station = stations.fetch(1)

print(station)

start = datetime(2020, 1, 1)
end = datetime(2024, 1, 13)

data = Daily(station.index[0], start, end)
data = data.fetch()
print(data)



model = LinearRegression()
X, y = data[['tavg', 'wdir', 'wspd', 'pres']], data['prcp']
X_train, x_test, y_train, y_test = train_test_split(X, y, test_size = 0.2)

model.fit(X_train, y_train);

cluster = MongoClient(mongodb_uri)
url = mongodb_uri
db = cluster["UserData"]
collection = db["Coefficients"]
collection.insert_one({"id": uniqueId, "coefficients":[model.coef_[0], model.coef_[1], model.coef_[2], model.coef_[3], model.intercept_]})
client = MongoClient(url, server_api=ServerApi('1'))
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)





