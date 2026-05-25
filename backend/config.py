import os
from dotenv import load_dotenv

load_dotenv()

SCENE = 20.0
MAX_DIM = 1200

WALL_HEIGHT = 2.98
WALL_THICKNESS = 0.22

DOOR_HEIGHT = 2.2
DOOR_WIDTH = 0.9
WINDOW_HEIGHT = 1.4

ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL1 = "floorplan-segmentation-imdze/4"
ROBOFLOW_MODEL2 = "floorplan-mihl2/2"