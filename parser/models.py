"""
SQLAlchemy ORM модели — зеркало таблиц из database/init.sql
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, SmallInteger,
    Boolean, Text, DECIMAL, ARRAY, DateTime, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()


def new_uuid():
    return str(uuid.uuid4())


class Property(Base):
    __tablename__ = "properties"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    property_type       = Column(String(20), nullable=False)
    deal_type           = Column(String(10), nullable=False)

    district            = Column(String(100))
    street              = Column(String(200))
    building_number     = Column(String(20))
    latitude            = Column(DECIMAL(10, 8))
    longitude           = Column(DECIMAL(11, 8))

    rooms               = Column(SmallInteger)
    floor               = Column(SmallInteger)
    total_floors        = Column(SmallInteger)
    area_sqm            = Column(DECIMAL(8, 2))

    current_price_usd   = Column(Integer)
    owner_price_usd     = Column(Integer)
    is_owner_verified   = Column(Boolean, default=False)
    owner_phone         = Column(String(30))

    photo_urls          = Column(ARRAY(Text))
    title               = Column(Text)
    description_raw     = Column(Text)
    description_clean   = Column(JSONB)

    fingerprint         = Column(String(64), unique=True)
    status              = Column(String(20), default="active")
    duplicate_count     = Column(SmallInteger, default=0)

    listings            = relationship("Listing", back_populates="property")
    price_history       = relationship("PriceHistory", back_populates="property",
                                       order_by="PriceHistory.recorded_at.desc()")


class Listing(Base):
    __tablename__ = "listings"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scraped_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    property_id     = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="SET NULL"), nullable=True)

    source_site     = Column(String(50), nullable=False)
    source_url      = Column(Text, nullable=False, unique=True)
    external_id     = Column(String(100))

    title           = Column(Text)
    description     = Column(Text)
    price_amd       = Column(BigInteger)
    price_usd       = Column(Integer)
    currency        = Column(String(5))

    poster_phone    = Column(String(30))
    poster_name     = Column(String(200))
    is_agency       = Column(Boolean, default=False)

    rooms           = Column(SmallInteger)
    floor           = Column(SmallInteger)
    total_floors    = Column(SmallInteger)
    area_sqm        = Column(DECIMAL(8, 2))
    district        = Column(String(100))
    address_raw     = Column(Text)

    photo_urls      = Column(ARRAY(Text))
    photo_hash      = Column(String(64))

    raw_data        = Column(JSONB)
    dedup_status    = Column(String(20), default="pending")
    is_active       = Column(Boolean, default=True)

    property        = relationship("Property", back_populates="listings")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recorded_at     = Column(DateTime(timezone=True), server_default=func.now())

    property_id     = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    listing_id      = Column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="SET NULL"), nullable=True)

    price_usd       = Column(Integer, nullable=False)
    price_amd       = Column(BigInteger)
    source_site     = Column(String(50))
    poster_phone    = Column(String(30))
    note            = Column(Text)

    property        = relationship("Property", back_populates="price_history")


class ScrapeLog(Base):
    __tablename__ = "scrape_logs"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    started_at      = Column(DateTime(timezone=True), server_default=func.now())
    finished_at     = Column(DateTime(timezone=True))

    source_site     = Column(String(50))
    pages_scraped   = Column(Integer, default=0)
    listings_found  = Column(Integer, default=0)
    new_listings    = Column(Integer, default=0)
    duplicates_found= Column(Integer, default=0)
    errors          = Column(ARRAY(Text))
    status          = Column(String(20), default="running")
