"""
Production Data Pipeline for Neurovia Agricultural AI Platform
Handles data validation, processing, combination, and preparation for production models
"""

import pandas as pd
import numpy as np
import os
import json
import logging
from datetime import datetime
from pathlib import Path
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/data_pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class DataPipeline:
    """Complete ETL pipeline for agricultural data"""
    
    def __init__(self, data_dir='data'):
        self.data_dir = Path(data_dir)
        self.raw_dir = self.data_dir / 'raw'
        self.processed_dir = self.data_dir / 'processed'
        self.splits_dir = self.data_dir / 'splits'
        
        # Create directories if they don't exist
        for dir_path in [self.raw_dir, self.processed_dir, self.splits_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # Feature mappings for different datasets
        self.feature_mapping = {
            'kaggle_crop': {
                'N': 'nitrogen',
                'P': 'phosphorus',
                'K': 'potassium',
                'temperature': 'temperature',
                'humidity': 'humidity',
                'ph': 'ph',
                'rainfall': 'rainfall',
                'label': 'crop'
            },
            'kaggle_yield': {
                'Area': 'area',
                'Item': 'crop',
                'Year': 'year',
                'average_rain_fall_mm_per_year': 'rainfall',
                'pesticides_tonnes': 'pesticides',
                'avg_temp': 'temperature',
                'hg/ha_yield': 'yield'
            }
        }
        
        self.stats = {
            'validation': {},
            'processing': {},
            'combination': {}
        }
    
    def validate_data(self):
        """Validate all raw datasets"""
        logger.info("=" * 60)
        logger.info("STEP 1: DATA VALIDATION")
        logger.info("=" * 60)
        
        datasets_found = []
        datasets_missing = []
        
        # Check Kaggle Crop Recommendation
        kaggle_crop_path = self.raw_dir / 'kaggle_crop_recommendation.csv'
        if kaggle_crop_path.exists():
            df = pd.read_csv(kaggle_crop_path)
            logger.info(f"✓ Kaggle Crop Recommendation: {len(df)} samples, {len(df.columns)} features")
            logger.info(f"  Features: {list(df.columns)}")
            logger.info(f"  Unique crops: {df['label'].nunique() if 'label' in df.columns else 'N/A'}")
            datasets_found.append('kaggle_crop')
            self.stats['validation']['kaggle_crop'] = {
                'samples': len(df),
                'features': len(df.columns),
                'crops': df['label'].nunique() if 'label' in df.columns else 0
            }
        else:
            logger.warning(f"✗ Kaggle Crop Recommendation not found at {kaggle_crop_path}")
            datasets_missing.append('kaggle_crop')
        
        # Check Kaggle Crop Yield
        kaggle_yield_path = self.raw_dir / 'kaggle_crop_yield.csv'
        if kaggle_yield_path.exists():
            df = pd.read_csv(kaggle_yield_path)
            logger.info(f"✓ Kaggle Crop Yield: {len(df)} samples, {len(df.columns)} features")
            logger.info(f"  Features: {list(df.columns)}")
            datasets_found.append('kaggle_yield')
            self.stats['validation']['kaggle_yield'] = {
                'samples': len(df),
                'features': len(df.columns)
            }
        else:
            logger.warning(f"✗ Kaggle Crop Yield not found at {kaggle_yield_path}")
            datasets_missing.append('kaggle_yield')
        
        # Check India Government Data
        india_gov_dir = self.raw_dir / 'india_gov'
        if india_gov_dir.exists() and list(india_gov_dir.glob('*.csv')):
            csv_files = list(india_gov_dir.glob('*.csv'))
            logger.info(f"✓ India Government Data: {len(csv_files)} CSV files found")
            datasets_found.append('india_gov')
            self.stats['validation']['india_gov'] = {
                'files': len(csv_files)
            }
        else:
            logger.warning(f"✗ India Government Data not found in {india_gov_dir}")
            datasets_missing.append('india_gov')
        
        logger.info("\n" + "=" * 60)
        logger.info(f"Validation Summary:")
        logger.info(f"  Datasets found: {len(datasets_found)}")
        logger.info(f"  Datasets missing: {len(datasets_missing)}")
        logger.info("=" * 60)
        
        if not datasets_found:
            logger.error("❌ No datasets found! Please download datasets first.")
            logger.info("\nQuick Start:")
            logger.info("1. Go to https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset")
            logger.info("2. Download Crop_recommendation.csv")
            logger.info(f"3. Save as: {kaggle_crop_path}")
            return False
        
        return True
    
    def process_kaggle_crop_data(self):
        """Process Kaggle Crop Recommendation dataset"""
        logger.info("\nProcessing Kaggle Crop Recommendation...")
        
        file_path = self.raw_dir / 'kaggle_crop_recommendation.csv'
        if not file_path.exists():
            logger.warning("Kaggle Crop Recommendation not found, skipping...")
            return None
        
        df = pd.read_csv(file_path)
        
        # Rename columns to standard names
        mapping = self.feature_mapping['kaggle_crop']
        df_processed = df.rename(columns=mapping)
        
        # Add source column
        df_processed['data_source'] = 'kaggle_crop'
        
        # Handle missing values
        df_processed = df_processed.dropna()
        
        # Normalize crop names
        df_processed['crop'] = df_processed['crop'].str.lower().str.strip()
        
        # Add derived features
        df_processed['npk_ratio'] = (
            df_processed['nitrogen'] + 
            df_processed['phosphorus'] + 
            df_processed['potassium']
        ) / 3
        
        # Save processed data
        output_path = self.processed_dir / 'kaggle_crop_processed.csv'
        df_processed.to_csv(output_path, index=False)
        
        logger.info(f"  ✓ Processed {len(df_processed)} samples")
        logger.info(f"  ✓ Saved to {output_path}")
        
        self.stats['processing']['kaggle_crop'] = {
            'input_samples': len(df),
            'output_samples': len(df_processed),
            'features': len(df_processed.columns)
        }
        
        return df_processed
    
    def process_kaggle_yield_data(self):
        """Process Kaggle Crop Yield dataset"""
        logger.info("\nProcessing Kaggle Crop Yield...")
        
        file_path = self.raw_dir / 'kaggle_crop_yield.csv'
        if not file_path.exists():
            logger.warning("Kaggle Crop Yield not found, skipping...")
            return None
        
        df = pd.read_csv(file_path)
        
        # Rename columns to standard names
        mapping = self.feature_mapping['kaggle_yield']
        df_processed = df.rename(columns=mapping)
        
        # Add source column
        df_processed['data_source'] = 'kaggle_yield'
        
        # Handle missing values
        df_processed = df_processed.dropna()
        
        # Normalize crop names
        if 'crop' in df_processed.columns:
            df_processed['crop'] = df_processed['crop'].str.lower().str.strip()
        
        # Convert yield from hg/ha to tons/hectare (1 hg = 0.0001 tons)
        if 'yield' in df_processed.columns:
            df_processed['yield'] = df_processed['yield'] * 0.0001
        
        # Save processed data
        output_path = self.processed_dir / 'kaggle_yield_processed.csv'
        df_processed.to_csv(output_path, index=False)
        
        logger.info(f"  ✓ Processed {len(df_processed)} samples")
        logger.info(f"  ✓ Saved to {output_path}")
        
        self.stats['processing']['kaggle_yield'] = {
            'input_samples': len(df),
            'output_samples': len(df_processed),
            'features': len(df_processed.columns)
        }
        
        return df_processed
    
    def process_india_gov_data(self):
        """Process India Government agricultural data"""
        logger.info("\nProcessing India Government Data...")
        
        india_gov_dir = self.raw_dir / 'india_gov'
        if not india_gov_dir.exists():
            logger.warning("India Government Data directory not found, skipping...")
            return None
        
        csv_files = list(india_gov_dir.glob('*.csv'))
        if not csv_files:
            logger.warning("No CSV files found in India Government Data directory, skipping...")
            return None
        
        all_data = []
        for csv_file in csv_files:
            try:
                df = pd.read_csv(csv_file)
                df['data_source'] = f'india_gov_{csv_file.stem}'
                all_data.append(df)
                logger.info(f"  ✓ Loaded {csv_file.name}: {len(df)} samples")
            except Exception as e:
                logger.warning(f"  ✗ Failed to load {csv_file.name}: {e}")
        
        if all_data:
            df_combined = pd.concat(all_data, ignore_index=True)
            
            # Handle missing values
            df_combined = df_combined.dropna()
            
            # Save processed data
            output_path = self.processed_dir / 'india_gov_processed.csv'
            df_combined.to_csv(output_path, index=False)
            
            logger.info(f"  ✓ Combined {len(all_data)} files into {len(df_combined)} samples")
            logger.info(f"  ✓ Saved to {output_path}")
            
            self.stats['processing']['india_gov'] = {
                'input_files': len(csv_files),
                'output_samples': len(df_combined),
                'features': len(df_combined.columns)
            }
            
            return df_combined
        
        return None
    
    def combine_crop_data(self):
        """Combine all crop recommendation datasets"""
        logger.info("\n" + "=" * 60)
        logger.info("COMBINING CROP RECOMMENDATION DATA")
        logger.info("=" * 60)
        
        # Load processed datasets
        datasets = []
        
        kaggle_crop_path = self.processed_dir / 'kaggle_crop_processed.csv'
        if kaggle_crop_path.exists():
            df = pd.read_csv(kaggle_crop_path)
            logger.info(f"✓ Loaded Kaggle Crop: {len(df)} samples")
            datasets.append(df)
        
        if not datasets:
            logger.error("❌ No crop datasets available for combination!")
            return None
        
        # Combine datasets
        df_combined = pd.concat(datasets, ignore_index=True)
        
        # Ensure all required columns exist
        required_cols = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'ph', 'rainfall', 'crop']
        available_cols = [col for col in required_cols if col in df_combined.columns]
        
        df_final = df_combined[available_cols + ['data_source']].copy()
        
        # Remove duplicates
        before_dedup = len(df_final)
        df_final = df_final.drop_duplicates()
        after_dedup = len(df_final)
        
        logger.info(f"\nCombination Summary:")
        logger.info(f"  Total samples: {before_dedup}")
        logger.info(f"  After deduplication: {after_dedup}")
        logger.info(f"  Duplicates removed: {before_dedup - after_dedup}")
        logger.info(f"  Unique crops: {df_final['crop'].nunique()}")
        logger.info(f"  Features: {len(df_final.columns)}")
        
        # Save combined data
        output_path = self.processed_dir / 'combined_crop_data.csv'
        df_final.to_csv(output_path, index=False)
        logger.info(f"  ✓ Saved to {output_path}")
        
        self.stats['combination']['crop'] = {
            'total_samples': before_dedup,
            'final_samples': after_dedup,
            'unique_crops': df_final['crop'].nunique(),
            'features': len(df_final.columns)
        }
        
        return df_final
    
    def combine_yield_data(self):
        """Combine all yield prediction datasets"""
        logger.info("\n" + "=" * 60)
        logger.info("COMBINING YIELD PREDICTION DATA")
        logger.info("=" * 60)
        
        # Load processed datasets
        datasets = []
        
        kaggle_yield_path = self.processed_dir / 'kaggle_yield_processed.csv'
        if kaggle_yield_path.exists():
            df = pd.read_csv(kaggle_yield_path)
            logger.info(f"✓ Loaded Kaggle Yield: {len(df)} samples")
            datasets.append(df)
        
        if not datasets:
            logger.warning("⚠ No yield datasets available, will use crop data for yield prediction")
            return None
        
        # Combine datasets
        df_combined = pd.concat(datasets, ignore_index=True)
        
        # Ensure required columns exist (include pesticides if available)
        required_cols = ['rainfall', 'temperature', 'pesticides', 'yield']
        available_cols = [col for col in required_cols if col in df_combined.columns]
        
        df_final = df_combined[available_cols + ['data_source']].copy()
        
        # Remove duplicates
        before_dedup = len(df_final)
        df_final = df_final.drop_duplicates()
        after_dedup = len(df_final)
        
        logger.info(f"\nCombination Summary:")
        logger.info(f"  Total samples: {before_dedup}")
        logger.info(f"  After deduplication: {after_dedup}")
        logger.info(f"  Duplicates removed: {before_dedup - after_dedup}")
        logger.info(f"  Features: {len(df_final.columns)}")
        
        # Save combined data
        output_path = self.processed_dir / 'combined_yield_data.csv'
        df_final.to_csv(output_path, index=False)
        logger.info(f"  ✓ Saved to {output_path}")
        
        self.stats['combination']['yield'] = {
            'total_samples': before_dedup,
            'final_samples': after_dedup,
            'features': len(df_final.columns)
        }
        
        return df_final
    
    def create_train_test_splits(self):
        """Create train/test splits for all datasets"""
        logger.info("\n" + "=" * 60)
        logger.info("CREATING TRAIN/TEST SPLITS")
        logger.info("=" * 60)
        
        # Crop data
        crop_path = self.processed_dir / 'combined_crop_data.csv'
        if crop_path.exists():
            df = pd.read_csv(crop_path)
            train, test = train_test_split(df, test_size=0.2, random_state=42, stratify=df['crop'])
            
            train.to_csv(self.splits_dir / 'train_crop.csv', index=False)
            test.to_csv(self.splits_dir / 'test_crop.csv', index=False)
            
            logger.info(f"✓ Crop data split:")
            logger.info(f"  Train: {len(train)} samples")
            logger.info(f"  Test: {len(test)} samples")
        
        # Yield data
        yield_path = self.processed_dir / 'combined_yield_data.csv'
        if yield_path.exists():
            df = pd.read_csv(yield_path)
            train, test = train_test_split(df, test_size=0.2, random_state=42)
            
            train.to_csv(self.splits_dir / 'train_yield.csv', index=False)
            test.to_csv(self.splits_dir / 'test_yield.csv', index=False)
            
            logger.info(f"✓ Yield data split:")
            logger.info(f"  Train: {len(train)} samples")
            logger.info(f"  Test: {len(test)} samples")
        
        logger.info("=" * 60)
    
    def generate_statistics_report(self):
        """Generate detailed statistics report"""
        logger.info("\n" + "=" * 60)
        logger.info("PIPELINE STATISTICS REPORT")
        logger.info("=" * 60)
        
        # Save stats to JSON
        stats_path = self.processed_dir / 'pipeline_stats.json'
        with open(stats_path, 'w') as f:
            json.dump(self.stats, f, indent=2)
        
        logger.info(f"\n✓ Full statistics saved to {stats_path}")
        
        # Print summary
        logger.info("\n" + "=" * 60)
        logger.info("SUMMARY")
        logger.info("=" * 60)
        
        if 'crop' in self.stats.get('combination', {}):
            crop_stats = self.stats['combination']['crop']
            logger.info(f"\nCrop Recommendation:")
            logger.info(f"  Final samples: {crop_stats['final_samples']}")
            logger.info(f"  Unique crops: {crop_stats['unique_crops']}")
            logger.info(f"  Features: {crop_stats['features']}")
        
        if 'yield' in self.stats.get('combination', {}):
            yield_stats = self.stats['combination']['yield']
            logger.info(f"\nYield Prediction:")
            logger.info(f"  Final samples: {yield_stats['final_samples']}")
            logger.info(f"  Features: {yield_stats['features']}")
        
        logger.info("\n" + "=" * 60)
        logger.info("✅ DATA PIPELINE COMPLETE!")
        logger.info("=" * 60)
        logger.info("\nNext steps:")
        logger.info("1. Review processed data in data/processed/")
        logger.info("2. Check train/test splits in data/splits/")
        logger.info("3. Run: python train_production_models.py")
        logger.info("=" * 60)
    
    def run_pipeline(self):
        """Run the complete data pipeline"""
        logger.info("\n" + "=" * 60)
        logger.info("STARTING PRODUCTION DATA PIPELINE")
        logger.info("=" * 60)
        logger.info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 60)
        
        # Step 1: Validate data
        if not self.validate_data():
            return False
        
        # Step 2: Process individual datasets
        logger.info("\n" + "=" * 60)
        logger.info("STEP 2: DATA PROCESSING")
        logger.info("=" * 60)
        
        self.process_kaggle_crop_data()
        self.process_kaggle_yield_data()
        self.process_india_gov_data()
        
        # Step 3: Combine datasets
        logger.info("\n" + "=" * 60)
        logger.info("STEP 3: DATA COMBINATION")
        logger.info("=" * 60)
        
        self.combine_crop_data()
        self.combine_yield_data()
        
        # Step 4: Create splits
        logger.info("\n" + "=" * 60)
        logger.info("STEP 4: TRAIN/TEST SPLITS")
        logger.info("=" * 60)
        
        self.create_train_test_splits()
        
        # Step 5: Generate report
        self.generate_statistics_report()
        
        return True


def main():
    """Main execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Production Data Pipeline')
    parser.add_argument('--validate', action='store_true', help='Validate raw data only')
    parser.add_argument('--process', action='store_true', help='Process raw data')
    parser.add_argument('--combine', action='store_true', help='Combine processed data')
    parser.add_argument('--all', action='store_true', help='Run complete pipeline')
    
    args = parser.parse_args()
    
    pipeline = DataPipeline()
    
    if args.validate:
        pipeline.validate_data()
    elif args.process:
        pipeline.process_kaggle_crop_data()
        pipeline.process_kaggle_yield_data()
        pipeline.process_india_gov_data()
    elif args.combine:
        pipeline.combine_crop_data()
        pipeline.combine_yield_data()
        pipeline.create_train_test_splits()
    elif args.all or not any([args.validate, args.process, args.combine]):
        pipeline.run_pipeline()


if __name__ == '__main__':
    main()
