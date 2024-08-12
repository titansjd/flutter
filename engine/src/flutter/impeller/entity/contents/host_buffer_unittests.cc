// Copyright 2013 The Flutter Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include <limits>
#include <utility>
#include "flutter/testing/testing.h"
#include "impeller/base/validation.h"
#include "impeller/core/allocator.h"
#include "impeller/core/host_buffer.h"
#include "impeller/entity/entity_playground.h"

namespace impeller {
namespace testing {

using HostBufferTest = EntityPlayground;
INSTANTIATE_PLAYGROUND_SUITE(HostBufferTest);

TEST_P(HostBufferTest, CanEmplace) {
  struct Length2 {
    uint8_t pad[2];
  };
  static_assert(sizeof(Length2) == 2u);

  auto buffer = HostBuffer::Create(GetContext()->GetResourceAllocator());

  for (size_t i = 0; i < 12500; i++) {
    auto view = buffer->Emplace(Length2{});
    ASSERT_TRUE(view);
    ASSERT_EQ(view.range, Range(i * sizeof(Length2), 2u));
  }
}

TEST_P(HostBufferTest, CanEmplaceWithAlignment) {
  struct Length2 {
    uint8_t pad[2];
  };
  static_assert(sizeof(Length2) == 2);
  struct alignas(16) Align16 {
    uint8_t pad[2];
  };
  static_assert(alignof(Align16) == 16);
  static_assert(sizeof(Align16) == 16);

  auto buffer = HostBuffer::Create(GetContext()->GetResourceAllocator());
  ASSERT_TRUE(buffer);

  {
    auto view = buffer->Emplace(Length2{});
    ASSERT_TRUE(view);
    ASSERT_EQ(view.range, Range(0u, 2u));
  }

  {
    auto view = buffer->Emplace(Align16{});
    ASSERT_TRUE(view);
    ASSERT_EQ(view.range.offset, 16u);
    ASSERT_EQ(view.range.length, 16u);
  }
  {
    auto view = buffer->Emplace(Length2{});
    ASSERT_TRUE(view);
    ASSERT_EQ(view.range, Range(32u, 2u));
  }

  {
    auto view = buffer->Emplace(Align16{});
    ASSERT_TRUE(view);
    ASSERT_EQ(view.range.offset, 48u);
    ASSERT_EQ(view.range.length, 16u);
  }
}

TEST_P(HostBufferTest, HostBufferInitialState) {
  auto buffer = HostBuffer::Create(GetContext()->GetResourceAllocator());

  EXPECT_EQ(buffer->GetStateForTest().current_buffer, 0u);
  EXPECT_EQ(buffer->GetStateForTest().current_frame, 0u);
  EXPECT_EQ(buffer->GetStateForTest().total_buffer_count, 1u);
}

TEST_P(HostBufferTest, ResetIncrementsFrameCounter) {
  auto buffer = HostBuffer::Create(GetContext()->GetResourceAllocator());

  EXPECT_EQ(buffer->GetStateForTest().current_frame, 0u);

  buffer->Reset();
  EXPECT_EQ(buffer->GetStateForTest().current_frame, 1u);

  buffer->Reset();
  EXPECT_EQ(buffer->GetStateForTest().current_frame, 2u);

  buffer->Reset();
  EXPECT_EQ(buffer->GetStateForTest().current_frame, 0u);
}

TEST_P(HostBufferTest,
       EmplacingLargerThanBlockSizeCreatesOneOffBufferCallback) {
  auto buffer = HostBuffer::Create(GetContext()->GetResourceAllocator());

  // Emplace an amount larger than the block size, to verify that the host
  // buffer does not create a buffer.
  auto buffer_view = buffer->Emplace(1024000 + 10, 0, [](uint8_t* data) {});

  EXPECT_EQ(buffer->GetStateForTest().current_buffer, 0u);
  EXPECT_EQ(buffer->GetStateForTest().current_frame, 0u);
  EXPECT_EQ(buffer->GetStateForTest().total_buffer_count, 1u);
}

TEST_P(HostBufferTest, EmplacingLargerThanBlockSizeCreatesOneOffBuffer) {
  auto buffer = HostBuffer::Create(GetContext()->GetResourceAllocator());

  // Emplace an amount larger than the block size, to verify that the host
  // buffer does not create a buffer.
  auto buffer_view = buffer->Emplace(nullptr, 1024000 + 10, 0);

  EXPECT_EQ(buffer->GetStateForTest().current_buffer, 0u);
  EXPECT_EQ(buffer->GetStateForTest().current_frame, 0u);
  EXPECT_EQ(buffer->GetStateForTest().total_buffer_count, 1u);
}

TEST_P(HostBufferTest, UnusedBuffersAreDiscardedWhenResetting) {
  auto buffer = HostBuffer::Create(GetContext()->GetResourceAllocator());

  // Emplace two large allocations to force the allocation of a second buffer.
  auto buffer_view_a = buffer->Emplace(1020000, 0, [](uint8_t* data) {});
  auto buffer_view_b = buffer->Emplace(1020000, 0, [](uint8_t* data) {});

  EXPECT_EQ(buffer->GetStateForTest().current_buffer, 1u);
  EXPECT_EQ(buffer->GetStateForTest().total_buffer_count, 2u);
  EXPECT_EQ(buffer->GetStateForTest().current_frame, 0u);

  // Reset until we get back to this frame.
  for (auto i = 0; i < 3; i++) {
    buffer->Reset();
  }

  EXPECT_EQ(buffer->GetStateForTest().current_buffer, 0u);
  EXPECT_EQ(buffer->GetStateForTest().total_buffer_count, 2u);
  EXPECT_EQ(buffer->GetStateForTest().current_frame, 0u);

  // Now when we reset, the buffer should get dropped.
  // Reset until we get back to this frame.
  for (auto i = 0; i < 3; i++) {
    buffer->Reset();
  }

  EXPECT_EQ(buffer->GetStateForTest().current_buffer, 0u);
  EXPECT_EQ(buffer->GetStateForTest().total_buffer_count, 1u);
  EXPECT_EQ(buffer->GetStateForTest().current_frame, 0u);
}

TEST_P(HostBufferTest, EmplaceWithProcIsAligned) {
  auto buffer = HostBuffer::Create(GetContext()->GetResourceAllocator());

  BufferView view = buffer->Emplace(std::array<char, 21>());
  EXPECT_EQ(view.range, Range(0, 21));

  view = buffer->Emplace(64, 16, [](uint8_t*) {});
  EXPECT_EQ(view.range, Range(32, 64));
}

static constexpr const size_t kMagicFailingAllocation = 1024000 * 2;

class FailingAllocator : public Allocator {
 public:
  explicit FailingAllocator(std::shared_ptr<Allocator> delegate)
      : Allocator(), delegate_(std::move(delegate)) {}

  ~FailingAllocator() = default;

  std::shared_ptr<DeviceBuffer> OnCreateBuffer(
      const DeviceBufferDescriptor& desc) {
    // Magic number used in test below to trigger failure.
    if (desc.size == kMagicFailingAllocation) {
      return nullptr;
    }
    return delegate_->CreateBuffer(desc);
  }

  std::shared_ptr<Texture> OnCreateTexture(const TextureDescriptor& desc) {
    return delegate_->CreateTexture(desc);
  }

  ISize GetMaxTextureSizeSupported() const override {
    return delegate_->GetMaxTextureSizeSupported();
  }

 private:
  std::shared_ptr<Allocator> delegate_;
};

TEST_P(HostBufferTest, EmplaceWithFailingAllocationDoesntCrash) {
  ScopedValidationDisable disable;
  std::shared_ptr<FailingAllocator> allocator =
      std::make_shared<FailingAllocator>(GetContext()->GetResourceAllocator());
  auto buffer = HostBuffer::Create(allocator);

  auto view = buffer->Emplace(nullptr, kMagicFailingAllocation, 0);

  EXPECT_EQ(view.buffer, nullptr);
  EXPECT_EQ(view.range.offset, 0u);
  EXPECT_EQ(view.range.length, 0u);
}

}  // namespace  testing
}  // namespace impeller
