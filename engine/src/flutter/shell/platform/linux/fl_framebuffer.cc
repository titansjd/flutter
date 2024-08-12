// Copyright 2013 The Flutter Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "fl_framebuffer.h"

#include <epoxy/gl.h>

struct _FlFramebuffer {
  GObject parent_instance;

  // Width of framebuffer in pixels.
  size_t width;

  // Height of framebuffer in pixels.
  size_t height;

  // Framebuffer ID.
  GLuint framebuffer_id;

  // Texture backing framebuffer.
  GLuint texture_id;
};

G_DEFINE_TYPE(FlFramebuffer, fl_framebuffer, G_TYPE_OBJECT)

static void fl_framebuffer_dispose(GObject* object) {
  FlFramebuffer* self = FL_FRAMEBUFFER(object);

  glDeleteFramebuffers(1, &self->framebuffer_id);
  glDeleteTextures(1, &self->texture_id);

  G_OBJECT_CLASS(fl_framebuffer_parent_class)->dispose(object);
}

static void fl_framebuffer_class_init(FlFramebufferClass* klass) {
  G_OBJECT_CLASS(klass)->dispose = fl_framebuffer_dispose;
}

static void fl_framebuffer_init(FlFramebuffer* self) {}

FlFramebuffer* fl_framebuffer_new(size_t width, size_t height) {
  FlFramebuffer* provider =
      FL_FRAMEBUFFER(g_object_new(fl_framebuffer_get_type(), nullptr));

  provider->width = width;
  provider->height = height;

  glGenTextures(1, &provider->texture_id);
  glGenFramebuffers(1, &provider->framebuffer_id);

  glBindFramebuffer(GL_FRAMEBUFFER, provider->framebuffer_id);

  glBindTexture(GL_TEXTURE_2D, provider->texture_id);
  glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
  glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, width, height, 0, GL_RGBA,
               GL_UNSIGNED_BYTE, NULL);
  glBindTexture(GL_TEXTURE_2D, 0);

  glFramebufferTexture2D(GL_FRAMEBUFFER_EXT, GL_COLOR_ATTACHMENT0_EXT,
                         GL_TEXTURE_2D, provider->texture_id, 0);

  return provider;
}

GLuint fl_framebuffer_get_id(FlFramebuffer* self) {
  return self->framebuffer_id;
}

GLuint fl_framebuffer_get_texture_id(FlFramebuffer* self) {
  return self->texture_id;
}

GLenum fl_framebuffer_get_target(FlFramebuffer* self) {
  return GL_TEXTURE_2D;
}

GLenum fl_framebuffer_get_format(FlFramebuffer* self) {
  // Flutter defines SK_R32_SHIFT=16, so SK_PMCOLOR_BYTE_ORDER should be BGRA.
  // In Linux kN32_SkColorType is assumed to be kBGRA_8888_SkColorType.
  // So we must choose a valid gl format to be compatible with surface format
  // BGRA8.
  // Following logic is copied from Skia GrGLCaps.cpp:
  // https://github.com/google/skia/blob/4738ed711e03212aceec3cd502a4adb545f38e63/src/gpu/ganesh/gl/GrGLCaps.cpp#L1963-L2116

  if (epoxy_is_desktop_gl()) {
    // For OpenGL.
    if (epoxy_gl_version() >= 12 || epoxy_has_gl_extension("GL_EXT_bgra")) {
      return GL_RGBA8;
    }
  } else {
    // For OpenGL ES.
    if (epoxy_has_gl_extension("GL_EXT_texture_format_BGRA8888") ||
        (epoxy_has_gl_extension("GL_APPLE_texture_format_BGRA8888") &&
         epoxy_gl_version() >= 30)) {
      return GL_BGRA8_EXT;
    }
  }
  g_critical("Failed to determine valid GL format for Flutter rendering");
  return GL_RGBA8;
}

size_t fl_framebuffer_get_width(FlFramebuffer* self) {
  return self->width;
}

size_t fl_framebuffer_get_height(FlFramebuffer* self) {
  return self->height;
}
