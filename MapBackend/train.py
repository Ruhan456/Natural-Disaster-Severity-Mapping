# Import necessary libraries
from fastai.vision.all import *
import os

# Define function to prepare data, train, and export model
def train_and_export_model():
    # Define the path to your image folder
    path = Path('C:/Users/Ruhan Bhavsar/Documents/Python/Map/MapBackend-main/earthquake_images')  # Replace with the correct path if needed

    # Verify the dataset path and check for images
    if not path.exists():
        print(f"Error: Dataset path '{path}' does not exist.")
        return

    if len(get_image_files(path)) == 0:
        print(f"Error: No images found in the dataset path '{path}'.")
        return

    # Create a DataBlock for image classification
    dblock = DataBlock(
        blocks=(ImageBlock, CategoryBlock),  # Input is an image, output is a category
        get_items=get_image_files,  # Get image files
        splitter=RandomSplitter(valid_pct=0.2, seed=42),  # 80% train, 20% validation
        get_y=parent_label,  # Labels are the parent folder names
        item_tfms=Resize(224),  # Resize images to 224x224 for the model
        batch_tfms=aug_transforms(mult=2)  # Data augmentation for training
    )

    # Load data
    try:
        dls = dblock.dataloaders(path, bs=8)  # Adjust batch size as needed
        print(f"Data successfully loaded. Classes: {dls.vocab}")
    except Exception as e:
        print(f"Error loading data: {e}")
        return

    # Display some data samples to verify
    dls.show_batch(max_n=4)
    plt.show()

    # Create a CNN learner using ResNet34 as the architecture
    try:
        learn = cnn_learner(dls, resnet34, metrics=accuracy)

        # Train the model (fine-tune for 5 epochs)
        print("Training the model...")
        learn.fine_tune(5)
    except Exception as e:
        print(f"Error during model training: {e}")
        return

    # Export the model to a .pkl file
    try:
        learn.export('earthquake_model.pkl')
        print("Model exported successfully to 'earthquake_model.pkl'.")
    except Exception as e:
        print(f"Error exporting the model: {e}")

# Train the model and export it
if __name__ == '__main__':
    train_and_export_model()
