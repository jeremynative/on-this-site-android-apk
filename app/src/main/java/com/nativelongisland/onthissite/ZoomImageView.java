package com.nativelongisland.onthissite;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.graphics.RectF;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.widget.ImageView;

/**
 * A photo that fills the screen fitted, then pinches to zoom (up to 6x),
 * drags around while zoomed, and double-taps between fitted and 2.5x at the
 * tapped spot. Used to look closely at AR card photos (a seal, a map, a
 * document).
 */
@SuppressLint("AppCompatCustomView") // The app has no AppCompat dependency; AR uses platform views.
final class ZoomImageView extends ImageView {
    private static final float MAX_ZOOM = 6f;
    private static final float DOUBLE_TAP_ZOOM = 2.5f;

    private final Matrix matrix = new Matrix();
    private final float[] values = new float[9];
    private final ScaleGestureDetector scaler;
    private final GestureDetector gestures;
    private float fitScale = 1f;

    ZoomImageView(Context context) {
        super(context);
        setScaleType(ScaleType.MATRIX);
        scaler = new ScaleGestureDetector(context, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
            @Override
            public boolean onScale(ScaleGestureDetector detector) {
                float target = Math.max(fitScale, Math.min(fitScale * MAX_ZOOM, scale() * detector.getScaleFactor()));
                float factor = target / scale();
                matrix.postScale(factor, factor, detector.getFocusX(), detector.getFocusY());
                settle();
                return true;
            }
        });
        gestures = new GestureDetector(context, new GestureDetector.SimpleOnGestureListener() {
            @Override
            public boolean onScroll(MotionEvent first, MotionEvent move, float dx, float dy) {
                matrix.postTranslate(-dx, -dy);
                settle();
                return true;
            }

            @Override
            public boolean onDoubleTap(MotionEvent event) {
                float target = scale() > fitScale * 1.2f ? fitScale : fitScale * DOUBLE_TAP_ZOOM;
                float factor = target / scale();
                matrix.postScale(factor, factor, event.getX(), event.getY());
                settle();
                return true;
            }
        });
    }

    @Override
    public void setImageBitmap(Bitmap bitmap) {
        super.setImageBitmap(bitmap);
        fit();
    }

    @Override
    protected void onSizeChanged(int width, int height, int oldWidth, int oldHeight) {
        super.onSizeChanged(width, height, oldWidth, oldHeight);
        fit();
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        scaler.onTouchEvent(event);
        if (!scaler.isInProgress()) gestures.onTouchEvent(event);
        return true;
    }

    /** The whole photo, centred. */
    private void fit() {
        if (getDrawable() == null || getWidth() == 0 || getHeight() == 0) return;
        float w = getDrawable().getIntrinsicWidth();
        float h = getDrawable().getIntrinsicHeight();
        fitScale = Math.min(getWidth() / w, getHeight() / h);
        matrix.reset();
        matrix.postScale(fitScale, fitScale);
        matrix.postTranslate((getWidth() - w * fitScale) / 2f, (getHeight() - h * fitScale) / 2f);
        setImageMatrix(matrix);
    }

    private float scale() {
        matrix.getValues(values);
        return values[Matrix.MSCALE_X];
    }

    /** Keeps the photo on screen: centred when smaller than the view, edges in when larger. */
    private void settle() {
        if (getDrawable() == null) return;
        RectF bounds = new RectF(0, 0, getDrawable().getIntrinsicWidth(), getDrawable().getIntrinsicHeight());
        matrix.mapRect(bounds);
        float dx = bounds.width() <= getWidth() ? (getWidth() - bounds.width()) / 2f - bounds.left
            : bounds.left > 0 ? -bounds.left : bounds.right < getWidth() ? getWidth() - bounds.right : 0;
        float dy = bounds.height() <= getHeight() ? (getHeight() - bounds.height()) / 2f - bounds.top
            : bounds.top > 0 ? -bounds.top : bounds.bottom < getHeight() ? getHeight() - bounds.bottom : 0;
        matrix.postTranslate(dx, dy);
        setImageMatrix(matrix);
    }
}
