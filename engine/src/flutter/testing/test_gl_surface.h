// Copyright 2013 The Flutter Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef FLUTTER_TESTING_TEST_GL_SURFACE_H_
#define FLUTTER_TESTING_TEST_GL_SURFACE_H_

#include <cstdint>

#include "flutter/fml/macros.h"

#include "third_party/skia/include/core/SkSurface.h"
#include "third_party/skia/include/gpu/GrDirectContext.h"

namespace flutter {
namespace testing {

struct TestEGLContext {
  explicit TestEGLContext();

  ~TestEGLContext();

  using EGLDisplay = void*;
  using EGLContext = void*;
  using EGLConfig = void*;

  EGLDisplay display;
  EGLContext onscreen_context;
  EGLContext offscreen_context;

  // EGLConfig is technically a property of the surfaces, no the context,
  // but it's not that well separated in EGL (e.g. when
  // EGL_KHR_no_config_context is not supported), so we just store it here.
  EGLConfig config;
};

class TestGLOnscreenOnlySurface {
 public:
  explicit TestGLOnscreenOnlySurface(SkISize surface_size);

  explicit TestGLOnscreenOnlySurface(std::shared_ptr<TestEGLContext> context,
                                     SkISize size);

  ~TestGLOnscreenOnlySurface();

  const SkISize& GetSurfaceSize() const;

  bool MakeCurrent();

  bool ClearCurrent();

  bool Present();

  uint32_t GetFramebuffer(uint32_t width, uint32_t height) const;

  void* GetProcAddress(const char* name) const;

  sk_sp<SkSurface> GetOnscreenSurface();

  sk_sp<GrDirectContext> GetGrContext();

  sk_sp<GrDirectContext> CreateGrContext();

  sk_sp<SkImage> GetRasterSurfaceSnapshot();

  uint32_t GetWindowFBOId() const;

 protected:
  using EGLSurface = void*;

  const SkISize surface_size_;
  std::shared_ptr<TestEGLContext> egl_context_;
  EGLSurface onscreen_surface_;

  sk_sp<GrDirectContext> skia_context_;

  FML_DISALLOW_COPY_AND_ASSIGN(TestGLOnscreenOnlySurface);
};

class TestGLSurface : public TestGLOnscreenOnlySurface {
 public:
  explicit TestGLSurface(SkISize surface_size);

  explicit TestGLSurface(std::shared_ptr<TestEGLContext> egl_context,
                         SkISize surface_size);

  ~TestGLSurface();

  bool MakeResourceCurrent();

 private:
  using EGLSurface = void*;

  EGLSurface offscreen_surface_;

  FML_DISALLOW_COPY_AND_ASSIGN(TestGLSurface);
};

}  // namespace testing
}  // namespace flutter

#endif  // FLUTTER_TESTING_TEST_GL_SURFACE_H_
