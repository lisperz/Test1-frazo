import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Alert,
} from '@mui/material';
import LabelStudio from 'label-studio';
import 'label-studio/build/static/css/main.css';
import { VideoAnnotation, LSFTask, LSFAnnotation } from '../../types/videoEditor';

interface LSFEditorProps {
  videoUrl: string;
  videoFile: File | null;
  onAnnotationsChange: (annotations: VideoAnnotation[]) => void;
}

const LSFEditor: React.FC<LSFEditorProps> = ({
  videoUrl,
  videoFile,
  onAnnotationsChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelStudioRef = useRef<any>(null);
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const config = `
    <View>
      <Video name="video" value="$video" frameRate="30" />
      <VideoRectangle name="box" toName="video" />
      <Labels name="videoLabels" toName="video">
        <Label value="Erase" background="#FF6B6B" />
        <Label value="Protect" background="#4ECDC4" />
        <Label value="Text" background="#45B7D1" />
      </Labels>
    </View>
  `;

  useEffect(() => {
    if (!containerRef.current || labelStudioRef.current) return;

    try {
      // Initialize Label Studio
      labelStudioRef.current = new LabelStudio(containerRef.current, {
        config,
        interfaces: [
          'panel',
          'update',
          'controls',
          'side-column',
          'annotations:menu',
          'annotations:add-new',
          'annotations:delete',
        ],
        task: {
          id: 1,
          data: {
            video: videoUrl,
            fps: 30,
          },
        },
        onUpdateAnnotation: (annotation: any) => {
          parseAnnotations(annotation);
        },
        onSubmitAnnotation: (annotation: any) => {
          parseAnnotations(annotation);
        },
      });
    } catch (err) {
      console.error('Failed to initialize Label Studio:', err);
      setError('Failed to initialize video editor');
    }

    return () => {
      if (labelStudioRef.current && labelStudioRef.current.destroy) {
        labelStudioRef.current.destroy();
        labelStudioRef.current = null;
      }
    };
  }, [videoUrl]);

  const parseAnnotations = (lsAnnotation: any) => {
    try {
      const results = lsAnnotation.serializeAnnotation();
      const parsed: VideoAnnotation[] = [];

      results.forEach((result: LSFAnnotation) => {
        if (result.type === 'videorectangle' && result.value) {
          const label = result.value.rectanglelabels?.[0];
          if (label && ['Erase', 'Protect', 'Text'].includes(label)) {
            parsed.push({
              id: result.id,
              label: label as 'Erase' | 'Protect' | 'Text',
              startTime: result.value.start || 0,
              endTime: result.value.end || 0,
              rectangle: {
                x: result.value.x / 100,
                y: result.value.y / 100,
                width: result.value.width / 100,
                height: result.value.height / 100,
              },
            });
          }
        }
      });

      setAnnotations(parsed);
      onAnnotationsChange(parsed);
    } catch (err) {
      console.error('Failed to parse annotations:', err);
      setError('Failed to parse annotations');
    }
  };

  const getAnnotationStats = () => {
    const stats = {
      Erase: 0,
      Protect: 0,
      Text: 0,
    };
    
    annotations.forEach((ann) => {
      stats[ann.label]++;
    });
    
    return stats;
  };

  const stats = getAnnotationStats();

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Video Annotation Editor
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Draw rectangles on the video and label them as areas to Erase, Protect, or mark as Text.
            Use the timeline to set when each annotation should be active.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`Erase: ${stats.Erase}`}
              sx={{ backgroundColor: '#FF6B6B', color: 'white' }}
            />
            <Chip
              label={`Protect: ${stats.Protect}`}
              sx={{ backgroundColor: '#4ECDC4', color: 'white' }}
            />
            <Chip
              label={`Text: ${stats.Text}`}
              sx={{ backgroundColor: '#45B7D1', color: 'white' }}
            />
          </Box>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, minHeight: 600 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </Paper>

      {annotations.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} added
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LSFEditor;