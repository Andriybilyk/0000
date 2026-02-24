/**
 * @file display_gui.cpp
 * @brief TFT Touchscreen GUI for Kiln Controller
 * @details Uses TFT_eSPI and LVGL for a TAP II-like interface.
 */

#include <TFT_eSPI.h>
#include <lvgl.h>

TFT_eSPI tft = TFT_eSPI();

/* LVGL Display Buffer */
static lv_disp_draw_buf_t draw_buf;
static lv_color_t buf[320 * 10]; // Adjust for 4.3" resolution e.g., 480x272

/* Touchpad read function */
void my_touchpad_read(lv_indev_drv_t * indev_driver, lv_indev_data_t * data) {
    uint16_t touchX, touchY;
    bool touched = tft.getTouch(&touchX, &touchY);
    if (!touched) {
        data->state = LV_INDEV_STATE_REL;
    } else {
        data->state = LV_INDEV_STATE_PR;
        data->point.x = touchX;
        data->point.y = touchY;
    }
}

/* Display flush function */
void my_disp_flush(lv_disp_drv_t *disp, const lv_area_t *area, lv_color_t *color_p) {
    uint32_t w = (area->x2 - area->x1 + 1);
    uint32_t h = (area->y2 - area->y1 + 1);
    tft.startWrite();
    tft.setAddrWindow(area->x1, area->y1, w, h);
    tft.pushColors((uint16_t *)&color_p->full, w * h, true);
    tft.endWrite();
    lv_disp_flush_ready(disp);
}

// UI Elements
lv_obj_t * temp_label;
lv_obj_t * state_label;
lv_obj_t * start_btn;

void btn_event_cb(lv_event_t * e) {
    lv_event_code_t code = lv_event_get_code(e);
    if(code == LV_EVENT_CLICKED) {
        // Toggle Start/Stop Firing
    }
}

void setupDisplay() {
    lv_init();
    tft.begin();
    tft.setRotation(1); // Landscape
    uint16_t calData[5] = { 275, 3620, 264, 3532, 1 };
    tft.setTouch(calData);

    lv_disp_draw_buf_init(&draw_buf, buf, NULL, 320 * 10);
    
    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res = 480;
    disp_drv.ver_res = 272;
    disp_drv.flush_cb = my_disp_flush;
    disp_drv.draw_buf = &draw_buf;
    lv_disp_drv_register(&disp_drv);

    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = my_touchpad_read;
    lv_indev_drv_register(&indev_drv);

    // Build UI (Home Screen)
    lv_obj_t * scr = lv_scr_act();
    lv_obj_set_style_bg_color(scr, lv_color_hex(0x1a1a1a), LV_PART_MAIN); // Dark theme

    temp_label = lv_label_create(scr);
    lv_label_set_text(temp_label, "20°C");
    lv_obj_set_style_text_font(temp_label, &lv_font_montserrat_48, 0);
    lv_obj_set_style_text_color(temp_label, lv_color_hex(0xffffff), 0);
    lv_obj_align(temp_label, LV_ALIGN_CENTER, 0, -40);

    state_label = lv_label_create(scr);
    lv_label_set_text(state_label, "IDLE");
    lv_obj_set_style_text_color(state_label, lv_color_hex(0x888888), 0);
    lv_obj_align(state_label, LV_ALIGN_CENTER, 0, 20);

    start_btn = lv_btn_create(scr);
    lv_obj_add_event_cb(start_btn, btn_event_cb, LV_EVENT_ALL, NULL);
    lv_obj_align(start_btn, LV_ALIGN_BOTTOM_MID, 0, -20);
    lv_obj_t * btn_label = lv_label_create(start_btn);
    lv_label_set_text(btn_label, "START FIRING");
}

void updateDisplay(double temp, double setpoint, int state) {
    char tempStr[16];
    sprintf(tempStr, "%.1f°C", temp);
    lv_label_set_text(temp_label, tempStr);
    
    switch(state) {
        case 0: lv_label_set_text(state_label, "IDLE"); break;
        case 1: lv_label_set_text(state_label, "HEATING"); break;
        case 2: lv_label_set_text(state_label, "HOLDING"); break;
        case 3: lv_label_set_text(state_label, "COOLING"); break;
        case 4: lv_label_set_text(state_label, "ERROR"); break;
    }
    lv_timer_handler();
}
